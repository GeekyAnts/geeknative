// @ts-check
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runLogged } from '../lib/exec.js'
import { CliError, color, log } from '../lib/log.js'
import { findAndroidSdk, pickSimulator, writeLocalProperties } from '../lib/toolchains.js'
import { gen } from './gen.js'

export const PLATFORMS = ['ios', 'android', 'web']

/**
 * Verifies the contracts, then builds and tests the requested apps.
 * Prints a short summary per platform; full output goes to .geeknative/logs/<platform>.log.
 * @param {string} root
 * @param {string[]} targets "all", "contracts", or platform names
 */
export async function check(root, targets) {
  const everything = !targets.length || targets.includes('all')
  const wanted = everything ? PLATFORMS : targets
  for (const target of wanted) {
    if (target !== 'contracts' && !PLATFORMS.includes(target)) {
      throw new CliError(`Unknown check "${target}". Use: all, contracts, ${PLATFORMS.join(', ')}.`)
    }
  }

  let failed = false
  try {
    gen(root, { check: true })
  } catch (error) {
    log.fail('contracts', /** @type {Error} */ (error).message)
    failed = true
  }

  for (const platform of wanted.filter((t) => t !== 'contracts')) {
    if (everything && platform === 'ios' && process.platform !== 'darwin') {
      log.warn('ios', 'skipped: iOS builds need macOS with Xcode')
      continue
    }
    const started = Date.now()
    const result = await CHECKS[platform](root)
    const seconds = `${Math.round((Date.now() - started) / 1000)}s`
    if (result.ok) {
      log.ok(platform, `${result.summary} ${color.dim(`(${seconds})`)}`)
    } else {
      failed = true
      log.fail(platform, `${result.summary} ${color.dim(`(${seconds}, full log: ${result.log})`)}`)
      for (const line of result.details.slice(0, 25)) log.detail(line)
      if (result.details.length > 25) log.detail(`… ${result.details.length - 25} more in the log`)
    }
  }
  if (failed) process.exitCode = 1
}

/** @typedef {{ ok: boolean, summary: string, details: string[], log: string }} CheckResult */

/** @param {string} root @param {string} platform */
const logPath = (root, platform) => path.join(root, '.geeknative', 'logs', `${platform}.log`)

/** @param {string} root @param {string} file */
const shown = (root, file) => path.relative(root, file)

/** @type {Record<string, (root: string) => Promise<CheckResult>>} */
const CHECKS = {
  async ios(root) {
    const logFile = logPath(root, 'ios')
    if (process.platform !== 'darwin') return fail('iOS builds need macOS with Xcode', [], root, logFile)
    const simulator = pickSimulator()
    if (!simulator) return fail('no iPhone simulator found; run `make doctor`', [], root, logFile)
    const firstBuild = !existsSync(path.join(root, 'apps', 'ios', '.build'))
    log.step('ios', `building and testing on ${simulator.name} (${simulator.runtime})…${firstBuild ? ' (first build: allow a few minutes)' : ''}`)
    const { code, lines } = await runLogged(
      'xcodebuild',
      [
        'test',
        '-project', 'App.xcodeproj',
        '-scheme', 'App',
        '-destination', `id=${simulator.udid}`,
        '-derivedDataPath', '.build/DerivedData',
        '-quiet',
      ],
      { cwd: path.join(root, 'apps', 'ios'), logFile },
    )
    const passed = lines.filter((l) => /^Test case '.*' passed/.test(l)).length
    if (code === 0) return { ok: true, summary: `build and ${passed} tests passed`, details: [], log: shown(root, logFile) }
    const details = unique(
      lines.filter((l) => /(error:|✘|failed|\*\* (BUILD|TEST) FAILED)/.test(l) && !/^\s*$/.test(l)).map((l) => l.trim()),
    )
    return fail(details.length ? 'build or tests failed' : `xcodebuild exited with ${code}`, details, root, logFile)
  },

  async android(root) {
    const logFile = logPath(root, 'android')
    const sdk = findAndroidSdk(root)
    if (!sdk) return fail('Android SDK not found; run `make doctor`', [], root, logFile)
    if (!existsSync(path.join(root, 'apps', 'android', 'local.properties'))) writeLocalProperties(root, sdk)
    const firstBuild = !existsSync(path.join(root, 'apps', 'android', 'app', 'build'))
    log.step('android', `building and running unit tests…${firstBuild ? ' (the first build downloads Gradle, JDK 21 and dependencies: allow several minutes)' : ''}`)
    const { code, lines } = await runLogged(
      './gradlew',
      [':app:testDebugUnitTest', ':app:assembleDebug', '--console=plain', '--warning-mode=summary'],
      { cwd: path.join(root, 'apps', 'android'), logFile },
    )
    if (code === 0) {
      const tests = junitCount(path.join(root, 'apps', 'android', 'app', 'build', 'test-results', 'testDebugUnitTest'))
      return { ok: true, summary: `build and ${tests} unit tests passed`, details: [], log: shown(root, logFile) }
    }
    const details = unique(
      lines
        .filter((l) => /^(e: |\s*[A-Za-z]+Test > .* FAILED|.*FAILED$|\* What went wrong|.*error:)/.test(l) || /^> /.test(l))
        .map((l) => l.trim())
        .filter((l) => !/^> Task /.test(l) && !/^> Configure project/.test(l)),
    )
    return fail('build or tests failed', details, root, logFile)
  },

  async web(root) {
    const logFile = logPath(root, 'web')
    if (!existsSync(path.join(root, 'node_modules'))) return fail('dependencies missing; run `npm install`', [], root, logFile)
    log.step('web', 'type-checking, testing and building…')
    const { code, lines } = await runLogged('npm', ['run', 'check', '--workspace', 'apps/web', '--silent'], {
      cwd: root,
      logFile,
      env: { NO_COLOR: '1', CI: '1' },
    })
    const tests = lines.map((l) => l.match(/^\s*Tests\s+(\d+) passed/)?.[1]).filter(Boolean).pop()
    if (code === 0) return { ok: true, summary: tests ? `types, ${tests} tests and build passed` : 'checks passed', details: [], log: shown(root, logFile) }
    const details = unique(
      lines.filter((l) => /(error TS\d+|✗|×|FAIL|Error:|AssertionError|expected)/.test(l)).map((l) => l.trim()),
    )
    return fail('type-check, tests or build failed', details, root, logFile)
  },
}

/** @param {string} summary @param {string[]} details @param {string} root @param {string} logFile @returns {CheckResult} */
function fail(summary, details, root, logFile) {
  return { ok: false, summary, details, log: shown(root, logFile) }
}

/** Total test count from Gradle's JUnit XML reports. @param {string} dir */
function junitCount(dir) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter((file) => file.endsWith('.xml'))
    .reduce((sum, file) => sum + Number(readFileSync(path.join(dir, file), 'utf8').match(/<testsuite[^>]* tests="(\d+)"/)?.[1] ?? 0), 0)
}

/** @param {string[]} lines */
const unique = (lines) => [...new Set(lines)]
