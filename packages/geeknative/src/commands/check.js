// @ts-check
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readConfig } from '../codegen/config.js'
import { featureCheckPlan } from './context.js'
import { parseDiagnostics } from '../lib/diagnostics.js'
import { dotenvForChild, requestedEnvironment } from '../lib/env.js'
import { runLogged } from '../lib/exec.js'
import { CliError, color, log } from '../lib/log.js'
import { createProgress, GRADLE_PHASES, XCODE_PASSED, XCODE_PHASES, XCODE_STARTED } from '../lib/progress.js'
import { readFeatures } from '../lib/specs.js'
import { findAndroidSdk, pickSimulator, writeLocalProperties } from '../lib/toolchains.js'
import { gen } from './gen.js'
import { lint } from './lint.js'

export const PLATFORMS = ['ios', 'android', 'web']

/**
 * @param {string[]} targets "all", "contracts", or platform names
 * @param {string | undefined} feature
 * @returns {{ everything: boolean, wanted: string[], feature?: string }}
 */
export function resolveCheckRequest(targets, feature) {
  if (feature !== undefined) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature)) {
      throw new CliError(`Unknown feature "${feature}". Use the id from spec/features/<id>.md.`)
    }
    if (targets.length !== 1 || !PLATFORMS.includes(targets[0])) {
      throw new CliError('Usage: geeknative check <ios|android|web> --feature <id>')
    }
    return { everything: false, wanted: targets, feature }
  }

  const everything = !targets.length || targets.includes('all')
  const wanted = everything ? PLATFORMS : targets
  for (const target of wanted) {
    if (target !== 'contracts' && !PLATFORMS.includes(target)) {
      throw new CliError(`Unknown check "${target}". Use: all, contracts, ${PLATFORMS.join(', ')}.`)
    }
  }
  return { everything, wanted }
}

/**
 * Verifies the contracts, then builds and tests the requested apps.
 * Prints a short summary per platform; full output goes to .geeknative/logs/<platform>.log
 * and a compact result to .geeknative/logs/<platform>.json.
 * @param {string} root
 * @param {string[]} targets "all", "contracts", or platform names
 * @param {{ feature?: string, json?: boolean }} [options]
 */
export async function check(root, targets, options = {}) {
  const { everything, wanted, feature } = resolveCheckRequest(targets, options.feature)
  if (feature && !readFeatures(root).some((item) => item.id === feature)) {
    throw new CliError(`No spec at spec/features/${feature}.md.`)
  }

  let failed = false
  try {
    gen(root, { check: true })
  } catch (error) {
    log.fail('contracts', /** @type {Error} */ (error).message)
    failed = true
  }

  // The rules builds can't enforce (hardcoded text, test IDs, title alignment, stale specs). They
  // run here so they hold even when the agent's hooks aren't loaded. A full check also checks the
  // specs; a single platform's check only checks that app's code, so a platform agent isn't
  // blocked by bookkeeping the lead does at the end.
  const platforms = /** @type {import('./lint.js').Platform[]} */ (wanted.filter((t) => PLATFORMS.includes(t)))
  if (platforms.length && !lint(root, { platforms, specs: everything })) failed = true

  // GEEKNATIVE_ENV picks which environment from contracts/config.json the apps are built for.
  // Unset, debug builds use development, as they do in Xcode and Android Studio.
  /** @type {string | undefined} */
  let environment
  try {
    environment = requestedEnvironment(readConfig(root).environments)
  } catch (error) {
    log.fail('config', /** @type {Error} */ (error).message)
    failed = true
  }
  if (environment) log.step('config', `building the ${environment} environment`)

  for (const platform of wanted.filter((t) => t !== 'contracts')) {
    if (everything && platform === 'ios' && process.platform !== 'darwin') {
      log.warn('ios', 'skipped: iOS builds need macOS with Xcode')
      continue
    }
    const started = Date.now()
    const result = await CHECKS[platform](root, environment, feature)
    const payload = writeResult(root, platform, feature, result)
    const seconds = `${Math.round((Date.now() - started) / 1000)}s`
    if (options.json) {
      log.info(JSON.stringify(payload))
    } else if (result.ok) {
      log.ok(platform, `${result.summary} ${color.dim(`(${seconds})`)}`)
    } else {
      log.fail(platform, `${result.summary} ${color.dim(`(${seconds}, ${payload.log.replace(/\.log$/, '.json')})`)}`)
      for (const error of result.errors.slice(0, 8)) log.detail(`${error.file}:${error.line} ${error.message}`)
      if (result.errors.length > 8) log.detail(`… ${result.errors.length - 8} more in ${payload.log.replace(/\.log$/, '.json')}`)
      if (result.unparsed) log.detail(`no structured errors; full log: ${result.log}`)
    }
    if (!result.ok) failed = true
  }
  if (failed) process.exitCode = 1
}

/**
 * @typedef {{ file: string, line: number, message: string }} Diagnostic
 * @typedef {{ ok: boolean, summary: string, errors: Diagnostic[], unparsed: boolean, log: string }} CheckResult
 */

/** @param {string} root @param {string} platform */
const logPath = (root, platform) => path.join(root, '.geeknative', 'logs', `${platform}.log`)

/** @param {string} root @param {string} file */
const shown = (root, file) => path.relative(root, file).split(path.sep).join('/')

/**
 * @param {string} root
 * @param {string} platform
 * @param {string | undefined} feature
 * @param {CheckResult} result
 */
function writeResult(root, platform, feature, result) {
  const payload = {
    status: result.ok ? 'passed' : 'failed',
    platform,
    feature: feature ?? null,
    summary: result.summary,
    errors: result.errors,
    ...(result.unparsed ? { unparsed: true } : {}),
    log: result.log,
  }
  const file = path.join(root, '.geeknative', 'logs', `${platform}.json`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`)
  return payload
}

/**
 * @param {string} summary
 * @param {Diagnostic[]} errors
 * @param {string} root
 * @param {string} logFile
 * @param {boolean} ran a compiler or test runner produced the log
 * @returns {CheckResult}
 */
function finish(summary, errors, root, logFile, ran, ok = false) {
  return { ok, summary, errors, unparsed: !ok && ran && errors.length === 0, log: shown(root, logFile) }
}

/** @type {Record<string, (root: string, environment?: string, feature?: string) => Promise<CheckResult>>} */
const CHECKS = {
  async ios(root, environment, feature) {
    const logFile = logPath(root, 'ios')
    if (process.platform !== 'darwin') return finish('iOS builds need macOS with Xcode', [], root, logFile, false)
    const simulator = pickSimulator()
    if (!simulator) return finish('no iPhone simulator found; run `make doctor`', [], root, logFile, false)
    const plan = feature ? featureCheckPlan(root, feature, 'ios') : { kind: 'ios', action: 'test', only: [] }
    if (plan.kind !== 'ios') throw new CliError('iOS check plan was not for iOS.')
    const firstBuild = !existsSync(path.join(root, 'apps', 'ios', '.build'))
    const verb = plan.action === 'build' ? 'building' : 'building and testing'
    const scope = feature ? ` ${feature}` : ''
    log.step('ios', `${verb}${scope} on ${simulator.name} (${simulator.runtime})…${firstBuild ? ' (first build: allow a few minutes)' : ''}`)
    const progress = createProgress({ phases: XCODE_PHASES, passed: XCODE_PASSED, started: XCODE_STARTED })
    const cwd = path.join(root, 'apps', 'ios')
    const { code, lines } = await runLogged(
      'xcodebuild',
      [
        plan.action,
        '-project', 'App.xcodeproj',
        '-scheme', 'App',
        '-destination', `id=${simulator.udid}`,
        '-derivedDataPath', '.build/DerivedData',
        // Parallel testing clones and boots a fresh copy of the simulator on every run, which
        // costs minutes; the suite is small enough to run on the simulator itself.
        ...(plan.action === 'test' ? ['-parallel-testing-enabled', 'NO'] : []),
        ...plan.only,
        // A build setting on the command line overrides APP_ENVIRONMENT in Config/Debug.xcconfig.
        ...(environment ? [`APP_ENVIRONMENT=${environment}`] : []),
      ],
      // Not -quiet: the progress lines come from xcodebuild's full output (which also goes to the log).
      { cwd, logFile, onLine: progress.onLine },
    )
    progress.stop()
    const errors = parseDiagnostics(lines, root, cwd)
    if (code === 0) {
      const passed = lines.filter((l) => XCODE_PASSED.test(l)).length
      const summary = plan.action === 'build' ? 'build passed' : `build and ${passed} tests passed`
      return { ok: true, summary, errors: [], unparsed: false, log: shown(root, logFile) }
    }
    return finish(errors.length ? 'build or tests failed' : `xcodebuild exited with ${code}`, errors, root, logFile, true)
  },

  async android(root, environment, feature) {
    const logFile = logPath(root, 'android')
    const sdk = findAndroidSdk(root)
    if (!sdk) return finish('Android SDK not found; run `make doctor`', [], root, logFile, false)
    if (!existsSync(path.join(root, 'apps', 'android', 'local.properties'))) writeLocalProperties(root, sdk)
    const plan = feature ? featureCheckPlan(root, feature, 'android') : null
    if (plan && plan.kind !== 'android') throw new CliError('Android check plan was not for Android.')
    const tasks = plan ? plan.tasks : [':app:testDebugUnitTest', ':app:assembleDebug']
    const firstBuild = !existsSync(path.join(root, 'apps', 'android', 'app', 'build'))
    const compiling = tasks.length === 1 && tasks[0] === ':app:compileDebugKotlin'
    log.step(
      'android',
      `${compiling ? 'compiling' : 'building and running unit tests'}${feature ? ` for ${feature}` : ''}…${firstBuild ? ' (the first build downloads Gradle, JDK 21 and dependencies: allow several minutes)' : ''}`,
    )
    const progress = createProgress({ phases: GRADLE_PHASES })
    const cwd = path.join(root, 'apps', 'android')
    const { code, lines } = await runLogged(
      './gradlew',
      [...tasks, '--console=plain', '--warning-mode=summary', ...(environment ? [`-PappEnvironment=${environment}`] : [])],
      { cwd, logFile, onLine: progress.onLine },
    )
    progress.stop()
    const errors = parseDiagnostics(lines, root, cwd)
    if (code === 0) {
      if (compiling) return { ok: true, summary: 'compile passed', errors: [], unparsed: false, log: shown(root, logFile) }
      const tests = feature
        ? lines.filter((l) => / PASSED$/.test(l.trim())).length
        : junitCount(path.join(root, 'apps', 'android', 'app', 'build', 'test-results', 'testDebugUnitTest'))
      return { ok: true, summary: `build and ${tests} unit tests passed`, errors: [], unparsed: false, log: shown(root, logFile) }
    }
    return finish('build or tests failed', errors, root, logFile, true)
  },

  async web(root, environment, feature) {
    const logFile = logPath(root, 'web')
    if (!existsSync(path.join(root, 'node_modules'))) return finish('dependencies missing; run `npm install`', [], root, logFile, false)
    const plan = feature ? featureCheckPlan(root, feature, 'web') : null
    if (plan && plan.kind !== 'web') throw new CliError('Web check plan was not for web.')
    log.step('web', feature ? `type-checking and testing ${feature}…` : 'type-checking, testing and building…')
    const env = { ...dotenvForChild(root), NO_COLOR: '1', CI: '1', ...(environment ? { VITE_APP_ENVIRONMENT: environment } : {}) }
    if (!feature) {
      const { code, lines } = await runLogged('npm', ['run', 'check', '--workspace', 'apps/web', '--silent'], { cwd: root, logFile, env })
      return webResult(root, logFile, code, lines, true)
    }
    const typecheck = await runLogged('npm', ['run', 'typecheck', '--workspace', 'apps/web', '--silent'], { cwd: root, logFile, env })
    if (typecheck.code !== 0) return webResult(root, logFile, typecheck.code, typecheck.lines, false)
    if (!plan?.vitest) {
      return { ok: true, summary: 'types passed', errors: [], unparsed: false, log: shown(root, logFile) }
    }
    const tests = await runLogged('npm', ['run', 'test', '--workspace', 'apps/web', '--silent', '--', plan.vitest], {
      cwd: root,
      logFile,
      env,
      append: true,
    })
    return webResult(root, logFile, tests.code, [...typecheck.lines, ...tests.lines], false)
  },
}

/**
 * @param {string} root
 * @param {string} logFile
 * @param {number} code
 * @param {string[]} lines
 * @param {boolean} built a production build was part of this run
 * @returns {CheckResult}
 */
function webResult(root, logFile, code, lines, built) {
  const errors = parseDiagnostics(lines, root, root)
  const tests = lines.map((l) => l.match(/^\s*Tests\s+(\d+) passed/)?.[1]).filter(Boolean).pop()
  if (code === 0) {
    const summary = built
      ? tests
        ? `types, ${tests} tests and build passed`
        : 'checks passed'
      : tests
        ? `types and ${tests} tests passed`
        : 'types passed'
    return { ok: true, summary, errors: [], unparsed: false, log: shown(root, logFile) }
  }
  return finish(built ? 'type-check, tests or build failed' : 'type-check or tests failed', errors, root, logFile, true)
}

/** Total test count from Gradle's JUnit XML reports. @param {string} dir */
function junitCount(dir) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter((file) => file.endsWith('.xml'))
    .reduce((sum, file) => sum + Number(readFileSync(path.join(dir, file), 'utf8').match(/<testsuite[^>]* tests="(\d+)"/)?.[1] ?? 0), 0)
}
