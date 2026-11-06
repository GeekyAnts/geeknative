// @ts-check
import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readConfig, resolveSecrets } from '../codegen/config.js'
import { readEnvFile } from '../lib/env.js'
import { capture, runInherit, runLogged } from '../lib/exec.js'
import { log } from '../lib/log.js'
import { isLocalCheckout, packCheckout, snapshotSource } from '../lib/project.js'
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

/**
 * How a project depends on geeknative, from its package.json `devDependencies.geeknative`:
 * "linked" to a folder (a checkout, which follows that checkout's branch), a "snapshot" tarball
 * in the project, or a "registry" version range.
 * @param {string | undefined} spec
 * @param {string} root
 * @returns {{ kind: 'linked' | 'snapshot' | 'registry' | 'missing', target?: string }}
 */
export function geeknativeSource(spec, root) {
  if (!spec) return { kind: 'missing' }
  if (!spec.startsWith('file:')) return { kind: 'registry', target: spec }
  const target = path.resolve(root, spec.slice('file:'.length))
  const isFolder = existsSync(target) && statSync(target).isDirectory()
  return { kind: isFolder ? 'linked' : 'snapshot', target }
}

/**
 * Warns when the project follows a geeknative checkout live, since switching that checkout's
 * branch changes what gen, check and run do here. With `fix`, pins it to a snapshot.
 * @param {string} root
 * @param {boolean} fix
 */
async function checkGeeknativeSource(root, fix) {
  const pkgFile = path.join(root, 'package.json')
  if (!existsSync(pkgFile)) return
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  const source = geeknativeSource(pkg.devDependencies?.geeknative, root)
  if (source.kind === 'registry') return log.ok('geeknative', `${source.target} from npm`)
  if (source.kind === 'snapshot') {
    log.ok('geeknative', `pinned to ${path.relative(root, source.target ?? '')}`)
    // A snapshot from a checkout that has moved on: say so, since fixes there don't reach this project.
    const from = snapshotSource()
    if (from?.commit && existsSync(from.checkout)) {
      const now = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: from.checkout })
      const branch = capture('git', ['branch', '--show-current'], { cwd: from.checkout })
      if (now && now !== from.commit) {
        log.warn('geeknative', `the checkout it came from is now at ${branch || 'detached'} ${now} (the snapshot is ${from.branch ?? 'detached'} ${from.commit})`)
        log.detail('Run `make pin` to use the newer geeknative here, then `make gen` and `make check`.')
      }
    }
    return
  }
  if (source.kind !== 'linked' || !source.target) return

  const branch = capture('git', ['branch', '--show-current'], { cwd: source.target })
  const commit = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: source.target })
  const where = branch || commit ? ` (now ${branch || 'detached'}${commit ? ` at ${commit}` : ''})` : ''
  if (!fix || !isLocalCheckout()) {
    log.warn('geeknative', `linked to the checkout at ${source.target}${where}`)
    log.detail('Switching that checkout to another branch changes what make gen, check and run do in this project.')
    log.detail('Run `make doctor FIX=1` to pin this project to a snapshot of the checkout as it is now.')
    return
  }
  const snapshot = packCheckout(path.join(root, '.geeknative'))
  pkg.devDependencies.geeknative = `file:.geeknative/${snapshot.file}`
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
  log.step('geeknative', `pinning to .geeknative/${snapshot.file}${where}, npm install…`)
  if ((await runInherit('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root })) === 0) {
    log.ok('geeknative', `pinned to .geeknative/${snapshot.file}`)
  } else log.fail('geeknative', 'npm install failed after pinning; run it again')
}

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

  await checkGeeknativeSource(root, fix)

  // Contracts
  try {
    gen(root, { check: true })
  } catch (error) {
    problem('contracts', /** @type {Error} */ (error).message)
  }

  // Secrets: warnings only, so CI and fresh clones without secrets still pass.
  checkSecrets(root, fix)

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

/**
 * Warns when a secret declared in contracts/config.json has no value in .env. Skipped when none
 * are declared, or when the contracts are invalid (the contracts step already reported that).
 * @param {string} root
 * @param {boolean} fix copy .env.example to .env when there is no .env
 */
function checkSecrets(root, fix) {
  let config
  try {
    config = readConfig(root)
  } catch {
    return
  }
  const declared = Object.keys(config.secrets).length
  if (!declared) return

  const example = path.join(root, '.env.example')
  if (fix && !existsSync(path.join(root, '.env')) && existsSync(example)) {
    copyFileSync(example, path.join(root, '.env'))
    log.step('secrets', 'created .env from .env.example')
  }
  const { warnings } = resolveSecrets(config, readEnvFile(root))
  if (!warnings.length) return log.ok('secrets', `${declared} key${declared === 1 ? '' : 's'} set in .env`)
  for (const warning of warnings) log.warn('secrets', warning)
  log.detail('Fill in .env, then run `make gen` to update the mobile apps.')
}
