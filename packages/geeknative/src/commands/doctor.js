// @ts-check
import { existsSync } from 'node:fs'
import path from 'node:path'
import { capture, runInherit, runLogged } from '../lib/exec.js'
import { log } from '../lib/log.js'
import {
  ANDROID_COMPILE_SDK,
  findAndroidSdk,
  hasCompilePlatform,
  pickSimulator,
  sdkManager,
  writeLocalProperties,
  xcodeMajorVersion,
} from '../lib/toolchains.js'
import { gen } from './gen.js'

const MIN_XCODE = 26
const MIN_NODE = 22

/**
 * Checks everything the three apps need to build. With `fix`, installs what it safely can.
 * @param {string} root
 * @param {{ fix?: boolean }} options
 */
export async function doctor(root, { fix = false }) {
  let problems = 0
  /** @param {string} label @param {string} message @param {string} [hint] */
  const problem = (label, message, hint) => {
    problems++
    log.fail(label, message)
    if (hint) log.detail(hint)
  }

  // Node and dependencies
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (nodeMajor >= MIN_NODE) log.ok('node', `v${process.versions.node}`)
  else problem('node', `v${process.versions.node} is too old`, `Install Node ${MIN_NODE} or later (24 LTS recommended).`)

  if (existsSync(path.join(root, 'node_modules'))) log.ok('deps', 'installed')
  else if (fix) {
    log.step('deps', 'running npm install…')
    if ((await runInherit('npm', ['install'], { cwd: root })) === 0) log.ok('deps', 'installed')
    else problem('deps', 'npm install failed')
  } else problem('deps', 'not installed', 'Run `npm install` (or `make doctor FIX=1`).')

  // Contracts
  try {
    gen(root, { check: true })
  } catch (error) {
    problem('contracts', /** @type {Error} */ (error).message)
  }

  // iOS
  if (process.platform !== 'darwin') {
    log.warn('ios', 'skipped: iOS builds need macOS with Xcode')
  } else {
    const xcode = xcodeMajorVersion()
    if (!xcode) problem('xcode', 'not found', 'Install Xcode from the App Store, then run `sudo xcode-select -s /Applications/Xcode.app`.')
    else if (xcode < MIN_XCODE) problem('xcode', `Xcode ${xcode} is too old`, `Install Xcode ${MIN_XCODE} or later.`)
    else {
      log.ok('xcode', capture('xcodebuild', ['-version'])?.split('\n')[0] ?? `Xcode ${xcode}`)
      const simulator = pickSimulator()
      if (simulator) log.ok('simulator', `${simulator.name} (${simulator.runtime})`)
      else problem('simulator', 'no iPhone simulator', 'Run `xcodebuild -downloadPlatform iOS` to install the iOS simulator runtime.')
    }
  }

  // Android
  const java = capture('java', ['-version'], { input: '' }) !== null || existsSync(process.env.JAVA_HOME ?? '/nonexistent')
  if (java) log.ok('java', 'found (Gradle downloads JDK 21 for the build itself)')
  else problem('java', 'no JDK found', 'Install a JDK 17 or later (for example `brew install --cask temurin`) so Gradle can start.')

  const sdk = findAndroidSdk(root)
  if (!sdk) {
    problem('android', 'Android SDK not found', 'Install Android Studio, or `brew install --cask android-commandlinetools`, then rerun.')
  } else {
    writeLocalProperties(root, sdk)
    log.ok('android', `SDK at ${sdk}`)
    if (hasCompilePlatform(sdk)) log.ok('platform', `Android API ${ANDROID_COMPILE_SDK} installed`)
    else if (fix) {
      const pkg = compilePlatformPackage(sdk)
      log.step('platform', `installing ${pkg}…`)
      const manager = sdkManager(sdk)
      const logFile = path.join(root, '.geeknative', 'logs', 'sdkmanager.log')
      await runLogged('sh', ['-c', `yes | "${manager}" --sdk_root="${sdk}" --licenses`], { logFile })
      if ((await runLogged(manager, [`--sdk_root=${sdk}`, pkg], { logFile })).code === 0) {
        log.ok('platform', `Android API ${ANDROID_COMPILE_SDK} installed`)
      } else problem('platform', `could not install ${pkg}`, `See ${path.relative(root, logFile)}.`)
    } else {
      problem('platform', `Android API ${ANDROID_COMPILE_SDK} is not installed`, 'Run `make doctor FIX=1` to install it.')
    }
  }

  log.info('')
  if (problems) {
    log.info(`${problems} problem${problems === 1 ? '' : 's'} found.${fix ? '' : ' `make doctor FIX=1` fixes what it can.'}`)
    process.exitCode = 1
  } else {
    log.info('All set. Try `make check`, then describe what you want to build to your coding agent.')
  }
}

/** The sdkmanager package for the compile SDK: newer platforms carry a minor version ("android-37.0"). @param {string} sdk */
function compilePlatformPackage(sdk) {
  const listing = capture(sdkManager(sdk), [`--sdk_root=${sdk}`, '--list'], { timeout: 120_000 }) ?? ''
  const exact = `platforms;android-${ANDROID_COMPILE_SDK}.0`
  return listing.includes(exact) ? exact : `platforms;android-${ANDROID_COMPILE_SDK}`
}
