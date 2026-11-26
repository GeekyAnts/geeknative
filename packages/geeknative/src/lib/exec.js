// @ts-check
import { spawn, spawnSync } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Runs a command, writing all of its output to `logFile`.
 * Agents get a short summary on screen and can open the log when they need detail.
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, logFile: string, env?: Record<string, string>, onLine?: (line: string) => void }} options
 *   `onLine` sees each line as it arrives, for progress reporting.
 * @returns {Promise<{ code: number, lines: string[] }>}
 */
export function runLogged(cmd, args, { cwd, logFile, env, onLine }) {
  mkdirSync(path.dirname(logFile), { recursive: true })
  return new Promise((resolve) => {
    const out = createWriteStream(logFile)
    out.write(`$ ${[cmd, ...args].join(' ')}\n\n`)
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env } })
    /** @type {string[]} */
    const lines = []
    let pending = ''
    /** @param {Buffer} chunk */
    const collect = (chunk) => {
      // Plain text: easier for agents to read, and for us to match.
      // eslint-disable-next-line no-control-regex
      const text = chunk.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      out.write(text)
      pending += text
      const parts = pending.split('\n')
      pending = parts.pop() ?? ''
      lines.push(...parts)
      if (onLine) for (const part of parts) onLine(part)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', (error) => {
      out.end()
      resolve({ code: 127, lines: [String(error)] })
    })
    child.on('close', (code) => {
      if (pending) {
        lines.push(pending)
        onLine?.(pending)
      }
      out.end()
      resolve({ code: code ?? 1, lines })
    })
  })
}

/**
 * Runs a command attached to this terminal (for dev servers and interactive tools).
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string> }} [options]
 * @returns {Promise<number>}
 */
export function runInherit(cmd, args, { cwd, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
    child.on('error', () => resolve(127))
    child.on('close', (code) => resolve(code ?? 1))
  })
}

/**
 * Runs a command and returns its trimmed stdout, or null when it fails or isn't installed.
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, input?: string, timeout?: number }} [options]
 */
export function capture(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options })
  return result.status === 0 ? result.stdout.trim() : null
}

/**
 * Same result as `capture`, but the event loop stays free while the command runs.
 * The dev session uses this for boot, wait, install and launch, which can sit for minutes.
 * `spawn` has no `timeout` option, so a timer sends SIGTERM, matching `spawnSync`.
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, input?: string, timeout?: number }} [options]
 * @returns {Promise<string | null>}
 */
export function captureAsync(cmd, args, { cwd, input, timeout } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'ignore'] })
    let stdout = ''
    let settled = false
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer
    /** @param {string | null} value */
    const finish = (value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(value)
    }
    if (timeout) {
      timer = setTimeout(() => {
        try {
          child.kill()
        } catch {
          // already exited
        }
        finish(null)
      }, timeout)
    }
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.on('error', () => finish(null))
    child.on('close', (code) => finish(code === 0 ? stdout.trim() : null))
    child.stdin.end(input ?? '')
  })
}

/** @param {string} cmd */
export function which(cmd) {
  return capture('which', [cmd])
}
