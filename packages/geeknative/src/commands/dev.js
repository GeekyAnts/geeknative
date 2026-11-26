// @ts-check
import { spawn } from 'node:child_process'
import { readApp } from '../codegen/app.js'
import { readConfig } from '../codegen/config.js'
import { dotenvForChild, requestedEnvironment } from '../lib/env.js'
import { CliError, color, log } from '../lib/log.js'
import { gen } from './gen.js'
import { runAndroid, runIos } from './run.js'

const WEB_URL = 'http://localhost:3000'

/** @typedef {'android' | 'ios' | 'reload' | 'clear' | 'help' | 'restart-web' | 'quit'} DevAction */

/**
 * Maps one raw key to a session action. Anything else is ignored.
 * Ctrl-C arrives as `\u0003` while stdin is in raw mode.
 * @param {string} key
 * @returns {DevAction | null}
 */
export function keyToAction(key) {
  switch (key) {
    case 'a':
      return 'android'
    case 'i':
      return 'ios'
    case 'r':
      return 'reload'
    case 'c':
      return 'clear'
    case '?':
      return 'help'
    case 'w':
      return 'restart-web'
    case 'q':
    case '\u0003':
      return 'quit'
    default:
      return null
  }
}

/** Small slant wordmark, lowercase. Widest line is 46 columns. */
const WORDMARK = [
  '                __              __  _         ',
  '  ___ ____ ___ / /__ ___  ___ _/ /_(_)  _____ ',
  ' / _ `/ -_) -_)  \'_// _ \\/ _ `/ __/ / |/ / -_)',
  ' \\_, /\\__/\\__/_/\\_\\/_//_/\\_,_/\\__/_/|___/\\__/ ',
  '/___/                                         ',
].join('\n')

/** Key list for the session. Native reload is a full rebuild, not live reload. */
export function menu() {
  const rows = [
    ['a', 'Android', 'build, install and launch'],
    ['i', 'iOS', 'build, install and launch'],
    ['r', 'reload', 'rebuild and relaunch iOS and Android already launched'],
    ['w', 'web', 'restart the dev server'],
    ['c', 'clear', 'clear the screen'],
    ['?', 'help', 'show this menu'],
    ['q', 'quit', 'stop web and exit'],
  ]
  const width = Math.max(...rows.map((row) => row[1].length))
  const lines = rows.map(([key, label, detail]) => `${color.bold(key)}  ${label.padEnd(width)}  ${color.dim(detail)}`)
  lines.push('', color.dim('web hot-reloads on its own. r does not live-reload iOS or Android.'))
  return lines.join('\n')
}

/**
 * Wordmark, app name, what is running, and the key menu.
 * @param {{ name: string, url: string, environment?: string, webUp: boolean, ios: boolean, android: boolean }} state
 */
export function sessionBanner(state) {
  const title = [color.bold(state.name), state.environment ? color.dim(state.environment) : ''].filter(Boolean).join('  ')
  const labelWidth = 'android'.length
  /** @param {string} label @param {string} value */
  const row = (label, value) => `${label.padEnd(labelWidth)}   ${value}`
  const status = [
    row('web', state.webUp ? color.cyan(state.url) : color.dim('exited')),
    row('ios', state.ios ? 'launched' : color.dim('not launched')),
    row('android', state.android ? 'launched' : color.dim('not launched')),
  ].join('\n')
  return `${color.cyan(color.bold(WORDMARK))}\n\n${title}\n\n${status}\n\n${menu()}`
}

/**
 * Starts the web dev server and reads single keys for iOS, Android and reload.
 * Requires a TTY. Native builds run one at a time and log to .geeknative/logs/.
 * @param {string} root
 */
export async function dev(root) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new CliError('geeknative run all needs a terminal. Keys do not work when input is piped.')
  }

  gen(root, { quiet: true })
  const environment = requestedEnvironment(readConfig(root).environments)
  const appName = readApp(root).name

  /** @type {Set<'ios' | 'android'>} */
  const launched = new Set()
  let busy = false
  let stopping = false
  let restarting = false
  /** Set while we are killing the web child on purpose, so its exit is not reported as a crash. */
  let expectExit = false
  /** @type {import('node:child_process').ChildProcess | null} */
  let web = null
  let webAlive = false

  const banner = () => {
    log.info(
      sessionBanner({
        name: appName,
        url: WEB_URL,
        environment,
        webUp: webAlive,
        ios: launched.has('ios'),
        android: launched.has('android'),
      }),
    )
  }

  /** @param {import('node:stream').Readable | null | undefined} stream @param {{ text: string }} pending */
  const prefixLines = (stream, pending) => {
    stream?.on('data', (chunk) => {
      pending.text += chunk.toString()
      const parts = pending.text.split('\n')
      pending.text = parts.pop() ?? ''
      for (const line of parts) process.stdout.write(`web  ${line}\n`)
    })
  }

  const startWeb = () => {
    if (webAlive || web) {
      log.warn('web', 'already running')
      return
    }
    const child = spawn('npm', ['run', 'dev', '--workspace', 'apps/web'], {
      cwd: root,
      // Own process group so quit can signal npm and the Vite process it starts.
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...dotenvForChild(root),
        ...(environment ? { VITE_APP_ENVIRONMENT: environment } : {}),
      },
    })
    web = child
    webAlive = true
    const stdout = { text: '' }
    const stderr = { text: '' }
    prefixLines(child.stdout, stdout)
    prefixLines(child.stderr, stderr)
    child.on('error', (error) => {
      webAlive = false
      log.fail('web', error.message)
    })
    child.on('close', (code) => {
      const unexpected = !expectExit && !stopping
      webAlive = false
      if (web === child) web = null
      expectExit = false
      if (stdout.text) process.stdout.write(`web  ${stdout.text}\n`)
      if (stderr.text) process.stdout.write(`web  ${stderr.text}\n`)
      if (unexpected) log.warn('web', `exited (${code ?? 1}). Press w to restart.`)
    })
  }

  const stopWeb = () => {
    const child = web
    if (!child?.pid) return
    expectExit = true
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      try {
        child.kill('SIGTERM')
      } catch {
        // already gone
      }
    }
  }

  const shutdown = () => {
    if (stopping) return
    stopping = true
    stopWeb()
    process.stdin.removeAllListeners('data')
    try {
      process.stdin.setRawMode(false)
    } catch {
      // stdin may already be closed
    }
    process.stdin.pause()
    process.exit(0)
  }

  /** @param {'ios' | 'android'} platform */
  const native = async (platform) => {
    if (busy) {
      log.warn('run', 'already building')
      return
    }
    busy = true
    try {
      if (platform === 'ios') await runIos(root, environment)
      else await runAndroid(root, environment)
      launched.add(platform)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.fail(platform, message)
    } finally {
      busy = false
    }
  }

  const reload = async () => {
    /** @type {string[]} */
    const refreshed = []
    if (!webAlive) {
      startWeb()
      refreshed.push('web')
    }
    if (launched.size === 0) {
      if (refreshed.length === 0) {
        log.info('web hot-reloads on its own; no iOS or Android app launched this session')
      } else {
        log.step('reload', 'web')
      }
      return
    }
    const platforms = [...launched]
    log.step('reload', [...refreshed, ...platforms].join(', '))
    for (const platform of platforms) await native(platform)
  }

  const restartWeb = () => {
    const child = web
    if (!child || child.exitCode !== null || child.signalCode !== null) {
      web = null
      webAlive = false
      startWeb()
      return
    }
    if (restarting) {
      log.warn('web', 'already restarting')
      return
    }
    restarting = true
    child.once('close', () => {
      restarting = false
      if (!stopping) startWeb()
    })
    stopWeb()
  }

  /** @param {string} key */
  const onKey = (key) => {
    const action = keyToAction(key)
    if (action === 'android' || action === 'ios') {
      void native(action)
      return
    }
    if (action === 'reload') {
      void reload()
      return
    }
    if (action === 'restart-web') {
      restartWeb()
      return
    }
    if (action === 'clear') {
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
      banner()
      return
    }
    if (action === 'help') {
      banner()
      return
    }
    if (action === 'quit') shutdown()
  }

  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.resume()
  process.stdin.on('data', (data) => {
    const text = String(data)
    // Arrow keys and other escapes arrive as several characters. Only single keys do anything.
    if (text.length === 1) onKey(text)
  })
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  startWeb()
  banner()
}
