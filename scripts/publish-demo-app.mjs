#!/usr/bin/env node
// Copies a GeekNative project into demo-apps/<slug>/ (unless --capture) and photographs every
// screen in previews/shots.json on iOS, Android and web, light and dark.
//
//   node scripts/publish-demo-app.mjs /path/to/app dine-in
//   node scripts/publish-demo-app.mjs --capture dine-in
//   node scripts/publish-demo-app.mjs --capture dine-in --platforms web --screens welcome,discover
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readApp } from '../packages/geeknative/src/codegen/app.js'
import { capture, runLogged } from '../packages/geeknative/src/lib/exec.js'
import { CliError, log } from '../packages/geeknative/src/lib/log.js'
import { adb, emulator, findAndroidSdk, pickSimulator, writeLocalProperties } from '../packages/geeknative/src/lib/toolchains.js'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const scriptsDir = path.join(repo, 'scripts')
const demoRoot = path.join(repo, 'demo-apps')
const SKIP_COPY = new Set([
  'node_modules',
  '.git',
  '.build',
  'DerivedData',
  '.gradle',
  '.kotlin',
  'build',
  '.idea',
  'dist',
  '.output',
  '.tanstack',
  '.nitro',
  '.vinxi',
  'xcuserdata',
  '.DS_Store',
  'local.properties',
])
const APPEARANCES = ['light', 'dark']
const PLATFORMS = ['ios', 'android', 'web']
const WEB_PORT = 4173
const SETTLE_MS = { ios: 2500, android: 6000, web: 800 }
const BLANK_STDEV = 12
const CAPTURE_RETRIES = 8

const requireFromScripts = createRequire(path.join(scriptsDir, 'package.json'))

function parseArgs(argv) {
  /** @type {{ captureOnly: boolean, slug?: string, source?: string, platforms: string[], screens?: string[] }} */
  const out = { captureOnly: false, platforms: [...PLATFORMS] }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--capture') {
      out.captureOnly = true
      continue
    }
    if (arg === '--platforms') {
      const value = argv[++i]
      if (!value) throw new CliError('--platforms needs a comma-separated list: ios,android,web')
      out.platforms = value.split(',').map((p) => p.trim()).filter(Boolean)
      continue
    }
    if (arg === '--screens') {
      const value = argv[++i]
      if (!value) throw new CliError('--screens needs a comma-separated list of screen ids')
      out.screens = value.split(',').map((s) => s.trim()).filter(Boolean)
      continue
    }
    if (arg.startsWith('-')) throw new CliError(`Unknown flag ${arg}`)
    rest.push(arg)
  }
  if (out.captureOnly) {
    out.slug = rest[0]
    if (!out.slug) throw new CliError('Usage: node scripts/publish-demo-app.mjs --capture <slug>')
  } else {
    out.source = rest[0]
    out.slug = rest[1]
    if (!out.source || !out.slug) {
      throw new CliError('Usage: node scripts/publish-demo-app.mjs <source> <slug>\n       node scripts/publish-demo-app.mjs --capture <slug>')
    }
  }
  for (const platform of out.platforms) {
    if (!PLATFORMS.includes(platform)) throw new CliError(`Unknown platform ${platform}`)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(out.slug)) {
    throw new CliError(`Slug "${out.slug}" must be lowercase kebab-case.`)
  }
  return out
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function passwordHash(email, password) {
  return createHash('sha256').update(`${email}:${password}`).digest('hex')
}

function readJson(file, label = file) {
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    throw new CliError(`Could not parse ${label}`)
  }
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseTable(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`)
  if (start < 0) return []
  const rest = markdown.slice(start)
  const end = rest.indexOf('\n## ', 4)
  const section = end < 0 ? rest : rest.slice(0, end)
  const rows = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (!cells.length || cells.every((c) => /^[-:]+$/.test(c))) continue
    if (/^screen$/i.test(cells[0]) || /^tab$/i.test(cells[0])) continue
    rows.push(cells)
  }
  return rows
}

function stubShots(root) {
  const nav = path.join(root, 'spec', 'navigation.md')
  if (!existsSync(nav)) throw new CliError('No spec/navigation.md, so a shots.json stub cannot be written.')
  const markdown = readFileSync(nav, 'utf8')
  /** @type {{ id: string, label: string, signedIn: boolean, webPath: string }[]} */
  const screens = []
  for (const [label, , webPath] of parseTable(markdown, 'Signed out')) {
    screens.push({ id: slugify(label), label, signedIn: false, webPath: webPath.split(/\s+/)[0] })
  }
  for (const row of parseTable(markdown, 'Signed in: tabs')) {
    const label = row[1] ?? row[0]
    const webPath = (row[3] ?? row[2] ?? '/').split(/\s+/)[0]
    screens.push({ id: slugify(label), label, signedIn: true, webPath })
  }
  for (const [label, , webPath] of parseTable(markdown, 'Signed in: pushed screens')) {
    screens.push({ id: slugify(label.split('(')[0]), label, signedIn: true, webPath: webPath.split(/\s+/)[0] })
  }
  if (!screens.length) throw new CliError('spec/navigation.md has no screen tables to turn into shots.json.')
  return {
    sample: { restaurantId: '', reservationId: '', member: { name: '', email: '', password: '', createdAt: '' }, reservations: [], saved: [] },
    screens,
  }
}

function loadShots(root) {
  const file = path.join(root, 'previews', 'shots.json')
  const shots = readJson(file, 'previews/shots.json')
  if (shots) {
    if (!Array.isArray(shots.screens) || !shots.screens.length) throw new CliError('previews/shots.json has no screens.')
    return shots
  }
  const stub = stubShots(root)
  writeJson(file, stub)
  throw new CliError(
    `Wrote a starter ${path.relative(root, file)} from spec/navigation.md. Fill in sample ids (restaurantId, reservationId, member) and rerun.`,
  )
}

function shouldSkipCopy(name) {
  return SKIP_COPY.has(name) || name.endsWith('.iml') || name.endsWith('.xcuserstate')
}

async function copyProject(source, dest) {
  const from = path.resolve(source)
  const to = path.resolve(dest)
  if (!existsSync(path.join(from, 'contracts', 'app.json'))) {
    throw new CliError(`${from} is not a GeekNative project (missing contracts/app.json).`)
  }
  if (from === to) {
    log.ok('copy', 'source is already demo-apps/' + path.basename(to))
    return
  }
  log.step('copy', `${from} → ${path.relative(repo, to)}`)
  mkdirSync(path.dirname(to), { recursive: true })
  await cp(from, to, {
    recursive: true,
    filter: (src) => !shouldSkipCopy(path.basename(src)),
  })
  log.ok('copy', path.relative(repo, to))
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new CliError(`${[cmd, ...args].join(' ')} failed${detail ? `:\n${detail}` : ''}`)
  }
  return (result.stdout ?? '').trim()
}

function ensureScriptDeps() {
  if (!existsSync(path.join(scriptsDir, 'node_modules', 'playwright')) || !existsSync(path.join(scriptsDir, 'node_modules', 'sharp'))) {
    log.step('previews', 'installing playwright and sharp…')
    run('npm', ['install'], { cwd: scriptsDir, stdio: 'inherit' })
  }
  return { sharp: requireFromScripts('sharp'), playwright: requireFromScripts('playwright') }
}

async function toWebp(sharp, pngPath, webpPath) {
  mkdirSync(path.dirname(webpPath), { recursive: true })
  await sharp(pngPath).webp({ quality: 82 }).toFile(webpPath)
}

async function pngLooksBlank(sharp, pngPath) {
  const stats = await sharp(pngPath).stats()
  const stdev = stats.channels.reduce((sum, channel) => sum + channel.stdev, 0) / stats.channels.length
  return stdev < BLANK_STDEV
}

async function captureWhenPainted({ take, dest, sharp, label, settle }) {
  let png
  for (let attempt = 0; attempt < CAPTURE_RETRIES; attempt++) {
    await sleep(attempt === 0 ? settle : 700)
    png = await take()
    if (!(await pngLooksBlank(sharp, png))) {
      await toWebp(sharp, png, dest)
      return
    }
  }
  log.warn('previews', `${label} still looks empty after ${CAPTURE_RETRIES} tries`)
  await toWebp(sharp, png, dest)
}

function connectedAndroid(adbPath) {
  const out = capture(adbPath, ['devices']) ?? ''
  return out.split('\n').slice(1).some((line) => /\tdevice$/.test(line))
}

async function bootAndroid(root) {
  const sdk = findAndroidSdk(root)
  if (!sdk) throw new CliError('Android SDK not found. Run `make doctor` inside the app.')
  writeLocalProperties(root, sdk)
  const adbPath = adb(sdk)
  if (!connectedAndroid(adbPath)) {
    const avds = (capture(emulator(sdk), ['-list-avds']) ?? '').split('\n').filter(Boolean)
    if (!avds.length) throw new CliError('No Android emulator. Create one in Android Studio, then rerun.')
    log.step('android', `starting emulator ${avds[0]}…`)
    spawn(emulator(sdk), ['-avd', avds[0]], { detached: true, stdio: 'ignore' }).unref()
    capture(adbPath, ['wait-for-device'], { timeout: 180_000 })
    for (let i = 0; i < 90 && capture(adbPath, ['shell', 'getprop', 'sys.boot_completed']) !== '1'; i++) {
      await sleep(2000)
    }
  }
  return { sdk, adbPath }
}

function freezeIosStatusBar(udid) {
  capture('xcrun', [
    'simctl',
    'status_bar',
    udid,
    'override',
    '--time',
    '15:00',
    '--dataNetwork',
    'wifi',
    '--wifiMode',
    'active',
    '--wifiBars',
    '3',
    '--cellularMode',
    'active',
    '--cellularBars',
    '4',
    '--operatorName',
    '',
    '--batteryState',
    'charged',
    '--batteryLevel',
    '100',
  ])
  capture('xcrun', ['simctl', 'spawn', udid, 'defaults', 'write', 'com.apple.Accessibility', 'ReduceMotionEnabled', '-int', '1'])
}

function freezeAndroidStatusBar(adbPath) {
  capture(adbPath, ['shell', 'settings', 'put', 'global', 'animator_duration_scale', '0'])
  capture(adbPath, ['shell', 'settings', 'put', 'global', 'transition_animation_scale', '0'])
  capture(adbPath, ['shell', 'settings', 'put', 'global', 'window_animation_scale', '0'])
  capture(adbPath, ['shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1'])
  capture(adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'enter'])
  capture(adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'clock', '-e', 'hhmm', '1500'])
  capture(adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4'])
  capture(adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'battery', '-e', 'plugged', 'false', '-e', 'level', '100'])
  capture(adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'notifications', '-e', 'visible', 'false'])
}

async function buildIos(root, udid) {
  const logFile = path.join(root, '.geeknative', 'logs', 'ios-previews.log')
  log.step('ios', 'building…')
  const build = await runLogged(
    'xcodebuild',
    ['build', '-project', 'App.xcodeproj', '-scheme', 'App', '-destination', `id=${udid}`, '-derivedDataPath', '.build/DerivedData', '-quiet'],
    { cwd: path.join(root, 'apps', 'ios'), logFile },
  )
  if (build.code !== 0) throw new CliError(`iOS build failed (log: ${path.relative(root, logFile)}).`)
  const app = path.join(root, 'apps', 'ios', '.build', 'DerivedData', 'Build', 'Products', 'Debug-iphonesimulator', 'App.app')
  if (!existsSync(app)) throw new CliError('iOS build produced no App.app.')
  if (capture('xcrun', ['simctl', 'install', udid, app]) === null) throw new CliError('Could not install the iOS app.')
}

async function buildAndroid(root) {
  const logFile = path.join(root, '.geeknative', 'logs', 'android-previews.log')
  log.step('android', 'building and installing…')
  const install = await runLogged('./gradlew', [':app:installDebug', '--console=plain'], {
    cwd: path.join(root, 'apps', 'android'),
    logFile,
  })
  if (install.code !== 0) throw new CliError(`Android install failed (log: ${path.relative(root, logFile)}).`)
}

function launchIos(udid, bundleId, screen, appearance) {
  capture('xcrun', ['simctl', 'terminate', udid, bundleId])
  capture('xcrun', ['simctl', 'ui', udid, 'appearance', appearance])
  const launched = capture('xcrun', [
    'simctl',
    'launch',
    '--terminate-running-process',
    udid,
    bundleId,
    '--',
    '-screenshotScreen',
    screen.id,
    '-screenshotAppearance',
    appearance,
  ])
  if (launched === null) throw new CliError(`Could not launch iOS for ${screen.id} ${appearance}.`)
}

function launchAndroid(adbPath, appId, screen, appearance, sample) {
  capture(adbPath, ['shell', 'cmd', 'uimode', 'night', appearance === 'dark' ? 'yes' : 'no'])
  const args = [
    'shell',
    'am',
    'start',
    '-W',
    '-S',
    '-n',
    `${appId}/app.MainActivity`,
    '--es',
    'screenshotScreen',
    screen.id,
    '--es',
    'screenshotAppearance',
    appearance,
  ]
  if (sample?.restaurantId) args.push('--es', 'screenshotRestaurantId', sample.restaurantId)
  if (sample?.reservationId) args.push('--es', 'screenshotReservationId', sample.reservationId)
  if (capture(adbPath, args) === null) throw new CliError(`Could not launch Android for ${screen.id} ${appearance}.`)
}

function webStorage(shots, screen, appearance) {
  /** @type {Record<string, string>} */
  const storage = { 'settings.appearance': appearance }
  const member = shots.sample?.member
  if (screen.signedIn && member?.email) {
    const email = member.email.trim().toLowerCase()
    storage['auth.accounts'] = JSON.stringify([
      {
        name: member.name,
        email,
        passwordHash: passwordHash(email, member.password),
        createdAt: member.createdAt,
      },
    ])
    storage['auth.session'] = email
    if (shots.sample.reservations?.length) storage[`reservations.${email}`] = JSON.stringify(shots.sample.reservations)
    if (shots.sample.saved?.length) storage[`saved.${email}`] = JSON.stringify(shots.sample.saved)
  }
  return storage
}

async function startWebPreview(root) {
  if (!existsSync(path.join(root, 'node_modules'))) {
    log.step('web', 'npm install…')
    run('npm', ['install'], { cwd: root, stdio: 'inherit' })
  }
  log.step('web', 'building…')
  const build = spawnSync('npm', ['run', 'build', '--workspace', 'apps/web'], { cwd: root, encoding: 'utf8' })
  if (build.status !== 0) throw new CliError(`Web build failed:\n${(build.stderr || build.stdout || '').trim()}`)
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(WEB_PORT), '--strictPort'], {
    cwd: path.join(root, 'apps', 'web'),
    stdio: 'pipe',
  })
  const origin = `http://127.0.0.1:${WEB_PORT}`
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(origin)
      if (res.ok || res.status === 404) return { child, origin }
    } catch {
      // still booting
    }
    await sleep(250)
  }
  child.kill()
  throw new CliError(`Web preview did not start on ${origin}.`)
}

async function capturePlatforms({ root, shots, screens, platforms, dest }) {
  const { sharp, playwright } = ensureScriptDeps()
  const { id: appId } = readApp(root)
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'geeknative-previews-'))
  let web
  let android

  try {
    if (platforms.includes('ios')) {
      const simulator = pickSimulator()
      if (!simulator) throw new CliError('No iPhone simulator found. Run `make doctor`.')
      if (simulator.state !== 'Booted') {
        log.step('ios', `booting ${simulator.name}…`)
        capture('xcrun', ['simctl', 'boot', simulator.udid])
      }
      capture('open', ['-a', 'Simulator'])
      await buildIos(root, simulator.udid)
      freezeIosStatusBar(simulator.udid)
      for (const screen of screens) {
        for (const appearance of APPEARANCES) {
          log.step('ios', `${screen.id} ${appearance}`)
          launchIos(simulator.udid, appId, screen, appearance)
          await captureWhenPainted({
            sharp,
            settle: SETTLE_MS.ios,
            dest: path.join(dest, 'ios', `${screen.id}-${appearance}.webp`),
            label: `ios ${screen.id} ${appearance}`,
            take: async () => {
              const png = path.join(tmp, `ios-${screen.id}-${appearance}.png`)
              if (capture('xcrun', ['simctl', 'io', simulator.udid, 'screenshot', png]) === null) {
                throw new CliError(`iOS screenshot failed for ${screen.id} ${appearance}.`)
              }
              return png
            },
          })
        }
      }
      log.ok('ios', `${screens.length * APPEARANCES.length} shots`)
    }

    if (platforms.includes('android')) {
      android = await bootAndroid(root)
      await buildAndroid(root)
      freezeAndroidStatusBar(android.adbPath)
      for (const screen of screens) {
        for (const appearance of APPEARANCES) {
          log.step('android', `${screen.id} ${appearance}`)
          launchAndroid(android.adbPath, appId, screen, appearance, shots.sample)
          await captureWhenPainted({
            sharp,
            settle: SETTLE_MS.android,
            dest: path.join(dest, 'android', `${screen.id}-${appearance}.webp`),
            label: `android ${screen.id} ${appearance}`,
            take: async () => {
              const png = path.join(tmp, `android-${screen.id}-${appearance}.png`)
              const shot = spawnSync(android.adbPath, ['exec-out', 'screencap', '-p'], { encoding: null, maxBuffer: 20 * 1024 * 1024 })
              if (shot.status !== 0 || !shot.stdout?.length) throw new CliError(`Android screenshot failed for ${screen.id} ${appearance}.`)
              writeFileSync(png, shot.stdout)
              return png
            },
          })
        }
      }
      log.ok('android', `${screens.length * APPEARANCES.length} shots`)
    }

    if (platforms.includes('web')) {
      web = await startWebPreview(root)
      const browser = await playwright.chromium.launch()
      try {
        for (const screen of screens) {
          for (const appearance of APPEARANCES) {
            log.step('web', `${screen.id} ${appearance}`)
            const context = await browser.newContext({
              viewport: { width: 1600, height: 1000 },
              deviceScaleFactor: 2,
              colorScheme: appearance,
            })
            await context.addInitScript((values) => {
              for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value)
            }, webStorage(shots, screen, appearance))
            const page = await context.newPage()
            await page.goto(`${web.origin}${screen.webPath}`, { waitUntil: 'networkidle' })
            await sleep(SETTLE_MS.web)
            const png = path.join(tmp, `web-${screen.id}-${appearance}.png`)
            await page.screenshot({ path: png, type: 'png' })
            await toWebp(sharp, png, path.join(dest, 'web', `${screen.id}-${appearance}.webp`))
            await context.close()
          }
        }
      } finally {
        await browser.close()
      }
      log.ok('web', `${screens.length * APPEARANCES.length} shots`)
    }
  } finally {
    web?.child.kill()
    rmSync(tmp, { recursive: true, force: true })
    if (android?.adbPath) capture(android.adbPath, ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', 'exit'])
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dest = path.join(demoRoot, args.slug)
  if (!args.captureOnly) await copyProject(args.source, dest)
  if (!existsSync(path.join(dest, 'contracts', 'app.json'))) {
    throw new CliError(`${path.relative(repo, dest)} is missing. Copy the app first, or pass its path.`)
  }

  const shots = loadShots(dest)
  const screens = args.screens ? shots.screens.filter((s) => args.screens.includes(s.id)) : shots.screens
  if (!screens.length) throw new CliError('No matching screens to capture.')
  const incomplete = screens.filter((s) => s.signedIn && /\$/.test(s.webPath))
  if (incomplete.length) {
    throw new CliError(
      `These signed-in paths still have placeholders: ${incomplete.map((s) => s.id).join(', ')}. Put real sample ids in previews/shots.json.`,
    )
  }

  const previews = path.join(dest, 'previews')
  log.step('previews', `${screens.length} screens × ${APPEARANCES.length} appearances × ${args.platforms.join(', ')}`)
  await capturePlatforms({ root: dest, shots, screens, platforms: args.platforms, dest: previews })
  log.ok('previews', path.relative(repo, previews))
}

main().catch((error) => {
  if (error instanceof CliError) {
    log.fail('previews', error.message)
    process.exit(1)
  }
  throw error
})
