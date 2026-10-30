// @ts-check
import { log } from './log.js'

/**
 * @typedef {{ match: RegExp, phase: string }} Phase a line that starts a phase, and what to call it
 * @typedef {{
 *   phases: Phase[],
 *   passed?: RegExp,
 *   heartbeat?: number,
 *   now?: () => number,
 *   print?: (message: string) => void,
 *   schedule?: (callback: () => void, ms: number) => { stop: () => void },
 * }} ProgressOptions
 */

/**
 * Turns a long build's output into a few progress lines: one when it enters a new phase
 * (compiling, linking, running tests, ...), and a heartbeat while a phase runs long, so a
 * multi-minute check never looks stuck. Full output still goes to the log file.
 * @param {ProgressOptions} options
 */
export function createProgress({ phases, passed, heartbeat = 30_000, now = Date.now, print = log.detail, schedule = interval }) {
  const started = now()
  /** @type {string | null} */
  let current = null
  let tests = 0
  const elapsed = () => `${Math.round((now() - started) / 1000)}s`
  const testsSoFar = () => (passed && tests ? `, ${tests} test${tests === 1 ? '' : 's'} passed so far` : '')

  const timer = schedule(() => {
    if (current) print(`still ${current}… (${elapsed()}${testsSoFar()})`)
  }, heartbeat)

  return {
    /** @param {string} line */
    onLine(line) {
      if (passed?.test(line)) tests++
      const next = phases.find((p) => p.match.test(line))?.phase
      if (next && next !== current) {
        current = next
        print(`${next}… (${elapsed()})`)
      }
    },
    stop() {
      timer.stop()
    },
  }
}

/** @param {() => void} callback @param {number} ms */
function interval(callback, ms) {
  const id = setInterval(callback, ms)
  id.unref()
  return { stop: () => clearInterval(id) }
}

/** Phases of `xcodebuild build` and `xcodebuild test`, from its plain (non -quiet) output. */
export const XCODE_PHASES = [
  { match: /^(SwiftDriver|SwiftCompile|CompileSwift|CompileC|CompileAssetCatalog|CompileXCStrings)\b/, phase: 'compiling' },
  { match: /^Ld\b/, phase: 'linking' },
  { match: /^(Testing started|Test suite '.*' started)/, phase: 'running tests' },
]

/** A passed test in xcodebuild's output. */
export const XCODE_PASSED = /^Test case '.*' passed/

/** Phases of the Gradle tasks `make check-android` runs, from `--console=plain` output. */
export const GRADLE_PHASES = [
  { match: /^> Task :app:compile\w*Kotlin/, phase: 'compiling' },
  { match: /^> Task :app:(dexBuilder|mergeProjectDex|package)\w*/, phase: 'packaging' },
  { match: /^> Task :app:test\w*UnitTest\b/, phase: 'running unit tests' },
  { match: /^> Task :app:install\w*/, phase: 'installing' },
]
