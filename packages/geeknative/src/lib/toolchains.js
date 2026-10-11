// @ts-check
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { capture } from './exec.js'

/** Android API level the app compiles against (apps/android/app/build.gradle.kts). */
export const ANDROID_COMPILE_SDK = 37

// ---------- Android ----------

/** @param {string} root */
function localPropertiesPath(root) {
  return path.join(root, 'apps', 'android', 'local.properties')
}

/**
 * Finds an Android SDK: local.properties, then ANDROID_HOME / ANDROID_SDK_ROOT, then common install locations.
 * @param {string} root
 * @returns {string | null}
 */
export function findAndroidSdk(root) {
  const local = localPropertiesPath(root)
  if (existsSync(local)) {
    const match = readFileSync(local, 'utf8').match(/^sdk\.dir=(.+)$/m)
    if (match && existsSync(match[1].trim())) return match[1].trim()
  }
  const home = os.homedir()
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(home, 'Library', 'Android', 'sdk'),
    '/opt/homebrew/share/android-commandlinetools',
    '/usr/local/share/android-commandlinetools',
    path.join(home, 'Android', 'Sdk'),
  ]
  for (const candidate of candidates) {
    if (candidate && existsSync(path.join(candidate, 'platform-tools'))) return candidate
    if (candidate && existsSync(path.join(candidate, 'platforms'))) return candidate
  }
  return null
}

/**
 * Points Gradle at the SDK. local.properties is machine-specific and git-ignored.
 * @param {string} root
 * @param {string} sdk
 */
export function writeLocalProperties(root, sdk) {
  writeFileSync(localPropertiesPath(root), `sdk.dir=${sdk}\n`)
}

/** @param {string} sdk */
export function hasCompilePlatform(sdk) {
  const platforms = path.join(sdk, 'platforms')
  if (!existsSync(platforms)) return false
  return readdirSync(platforms).some((name) => name === `android-${ANDROID_COMPILE_SDK}` || name.startsWith(`android-${ANDROID_COMPILE_SDK}.`))
}

/** @param {string} sdk */
export function sdkManager(sdk) {
  const bundled = path.join(sdk, 'cmdline-tools', 'latest', 'bin', 'sdkmanager')
  return existsSync(bundled) ? bundled : 'sdkmanager'
}

/** @param {string} sdk */
export function adb(sdk) {
  const bundled = path.join(sdk, 'platform-tools', 'adb')
  return existsSync(bundled) ? bundled : 'adb'
}

/** @param {string} sdk */
export function emulator(sdk) {
  const bundled = path.join(sdk, 'emulator', 'emulator')
  return existsSync(bundled) ? bundled : 'emulator'
}

// ---------- iOS ----------

/**
 * @typedef {{ udid: string, name: string, state: string, runtime: string, version: number[] }} Simulator
 */

/**
 * Picks the simulator to build and test on: GEEKNATIVE_IOS_SIMULATOR (name or UDID) if set,
 * otherwise a booted iPhone, otherwise an iPhone on the newest installed iOS runtime.
 * @returns {Simulator | null}
 */
export function pickSimulator() {
  const json = capture('xcrun', ['simctl', 'list', 'devices', 'available', '--json'])
  if (!json) return null
  /** @type {Simulator[]} */
  const all = []
  for (const [runtime, devices] of Object.entries(JSON.parse(json).devices ?? {})) {
    const match = runtime.match(/iOS-(\d+)-(\d+)(?:-(\d+))?$/)
    if (!match) continue
    const version = match.slice(1).filter(Boolean).map(Number)
    for (const device of /** @type {any[]} */ (devices)) {
      if (device.isAvailable === false) continue
      all.push({ udid: device.udid, name: device.name, state: device.state, runtime: `iOS ${version.join('.')}`, version })
    }
  }
  const wanted = process.env.GEEKNATIVE_IOS_SIMULATOR
  if (wanted) return all.find((sim) => sim.udid === wanted || sim.name === wanted) ?? null
  const iphones = all.filter((sim) => sim.name.startsWith('iPhone'))
  const booted = iphones.find((sim) => sim.state === 'Booted')
  if (booted) return booted
  iphones.sort((a, b) => compareVersions(b.version, a.version))
  return iphones[0] ?? null
}

/** @param {number[]} a @param {number[]} b */
function compareVersions(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff) return diff
  }
  return 0
}

/** Xcode's major version, or null when Xcode isn't installed. */
export function xcodeMajorVersion() {
  const out = capture('xcodebuild', ['-version'])
  const match = out?.match(/^Xcode (\d+)/m)
  return match ? Number(match[1]) : null
}
