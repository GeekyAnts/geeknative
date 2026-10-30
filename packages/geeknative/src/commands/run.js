// @ts-check
import { spawn } from 'node:child_process'
import path from 'node:path'
import { readApp } from '../codegen/app.js'
import { readConfig } from '../codegen/config.js'
import { dotenvForChild, requestedEnvironment } from '../lib/env.js'
import { capture, runInherit, runLogged } from '../lib/exec.js'
import { CliError, log } from '../lib/log.js'
import { adb, emulator, findAndroidSdk, pickSimulator, writeLocalProperties } from '../lib/toolchains.js'
import { gen } from './gen.js'

/**
 * Builds and launches one app: on a simulator, an emulator or device, or the web dev server.
 * @param {string} root
 * @param {string} platform
 */
export async function run(root, platform) {
  if (!['web', 'ios', 'android'].includes(platform)) throw new CliError('Usage: geeknative run <ios|android|web>')
  // Regenerate first, so a launch never uses stale code or an old .env (AppSecrets).
  gen(root, { quiet: true })
  // GEEKNATIVE_ENV picks the environment from contracts/config.json; unset means development.
  const environment = requestedEnvironment(readConfig(root).environments)
  if (environment) log.step('config', `running the ${environment} environment`)
  if (platform === 'web') return runWeb(root, environment)
  if (platform === 'ios') return runIos(root, environment)
  return runAndroid(root, environment)
}

/** @param {string} root @param {string} [environment] */
async function runWeb(root, environment) {
  process.exitCode = await runInherit('npm', ['run', 'dev', '--workspace', 'apps/web'], {
    cwd: root,
    // .env is passed along so server code that reads process.env (AppSecrets) works locally.
    env: { ...dotenvForChild(root), ...(environment ? { VITE_APP_ENVIRONMENT: environment } : {}) },
  })
}

/** @param {string} root @param {string} [environment] */
async function runIos(root, environment) {
  const simulator = pickSimulator()
  if (!simulator) throw new CliError('No iPhone simulator found. Run `make doctor`.')
  const { id } = readApp(root)
  const logFile = path.join(root, '.geeknative', 'logs', 'ios-run.log')

  if (simulator.state !== 'Booted') {
    log.step('ios', `booting ${simulator.name}…`)
    capture('xcrun', ['simctl', 'boot', simulator.udid])
  }
  capture('open', ['-a', 'Simulator'])

  log.step('ios', 'building…')
  const build = await runLogged(
    'xcodebuild',
    ['build', '-project', 'App.xcodeproj', '-scheme', 'App', '-destination', `id=${simulator.udid}`, '-derivedDataPath', '.build/DerivedData', '-quiet', ...(environment ? [`APP_ENVIRONMENT=${environment}`] : [])],
    { cwd: path.join(root, 'apps', 'ios'), logFile },
  )
  if (build.code !== 0) throw new CliError(`Build failed. Run \`make check-ios\` for details (log: ${path.relative(root, logFile)}).`)

  const app = path.join(root, 'apps', 'ios', '.build', 'DerivedData', 'Build', 'Products', 'Debug-iphonesimulator', 'App.app')
  if (capture('xcrun', ['simctl', 'install', simulator.udid, app]) === null) throw new CliError('Could not install the app on the simulator.')
  if (capture('xcrun', ['simctl', 'launch', simulator.udid, id]) === null) throw new CliError(`Could not launch ${id}.`)
  log.ok('ios', `running on ${simulator.name} (${simulator.runtime})`)
}

/** @param {string} root @param {string} [environment] */
async function runAndroid(root, environment) {
  const sdk = findAndroidSdk(root)
  if (!sdk) throw new CliError('Android SDK not found. Run `make doctor`.')
  writeLocalProperties(root, sdk)
  const { id } = readApp(root)
  const adbPath = adb(sdk)

  if (!connectedDevice(adbPath)) {
    const avds = (capture(emulator(sdk), ['-list-avds']) ?? '').split('\n').filter(Boolean)
    if (!avds.length) {
      throw new CliError(
        'No device or emulator. Connect a device with USB debugging on, or create an emulator in Android Studio (Device Manager), then rerun.',
      )
    }
    log.step('android', `starting emulator ${avds[0]}…`)
    spawn(emulator(sdk), ['-avd', avds[0]], { detached: true, stdio: 'ignore' }).unref()
    capture(adbPath, ['wait-for-device'], { timeout: 180_000 })
    for (let i = 0; i < 90 && capture(adbPath, ['shell', 'getprop', 'sys.boot_completed']) !== '1'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  log.step('android', 'building and installing…')
  const logFile = path.join(root, '.geeknative', 'logs', 'android-run.log')
  const install = await runLogged('./gradlew', [':app:installDebug', '--console=plain', ...(environment ? [`-PappEnvironment=${environment}`] : [])], {
    cwd: path.join(root, 'apps', 'android'),
    logFile,
  })
  if (install.code !== 0) throw new CliError(`Install failed. Run \`make check-android\` for details (log: ${path.relative(root, logFile)}).`)
  capture(adbPath, ['shell', 'am', 'start', '-n', `${id}/app.MainActivity`])
  log.ok('android', `running ${id}`)
}

/** @param {string} adbPath */
function connectedDevice(adbPath) {
  const out = capture(adbPath, ['devices']) ?? ''
  return out.split('\n').slice(1).some((line) => /\tdevice$/.test(line))
}
