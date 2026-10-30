// @ts-check
import { log } from './log.js'

/**
 * @typedef {{ match: RegExp, phase: string }} Phase a line that starts a phase, and what to call it
 * @typedef {{
 *   phases: Phase[],
 *   passed?: RegExp,
 *   started?: RegExp, a test starting; its first set capture group is the test's name
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
export function createProgress({ phases, passed, started, heartbeat = 30_000, now = Date.now, print = log.detail, schedule = interval }) {
  const begun = now()
  /** @type {string | null} */
  let current = null
  let reached = -1
  let tests = 0
  /** @type {string | null} the test running now, named in the heartbeat so a slow UI test doesn't look like a hang */
  let running = null
  const elapsed = () => `${Math.round((now() - begun) / 1000)}s`
  const testsSoFar = () => (passed && tests ? `, ${tests} test${tests === 1 ? '' : 's'} passed so far` : '')

  const timer = schedule(() => {
    if (current) print(`still ${current}… (${elapsed()}${testsSoFar()}${running ? `, now: ${running}` : ''})`)
  }, heartbeat)

  return {
    /** @param {string} line */
    onLine(line) {
      if (passed?.test(line)) {
        tests++
        running = null
      }
      const match = started && line.match(started)
      const name = match && (match[1] ?? match[2])
      if (name) running = name
      // Phases only move forward: Xcode builds the app and then the test bundle, which would
      // otherwise flip between compiling and linking.
      const index = phases.findIndex((p) => p.match.test(line))
      if (index > reached) {
        reached = index
        current = phases[index].phase
        print(`${current}… (${elapsed()})`)
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
  // A cold build first precompiles the system modules it imports, which takes a while.
  { match: /^(SwiftExplicitDependency\w*|ScanDependencies|PrecompileModule)\b/, phase: 'preparing modules' },
  { match: /^(SwiftDriver|SwiftCompile|CompileSwift|CompileC|CompileAssetCatalog|CompileXCStrings)\b/, phase: 'compiling' },
  // Not the tiny __preview.dylib stub Xcode links before compiling anything.
  { match: /^Ld (?!.*__preview\.dylib)/, phase: 'linking' },
  { match: /^(Testing started|Test [Ss]uite '.*' started|◇ Test run started)/, phase: 'running tests' },
]

/**
 * A passed test in xcodebuild's output: Swift Testing (`✔ Test "..." passed`) or XCTest
 * (`Test Case '...' passed`, or `Test case '...' passed` when tests run in parallel).
 */
export const XCODE_PASSED = /^(✔ Test ".*" passed|Test [Cc]ase '.*' passed)/

/** A test starting: Swift Testing (`◇ Test "name" started.`) or XCTest (`Test Case '-[Class test]' started.`). */
export const XCODE_STARTED = /^(?:◇ Test "(.*)" started|Test Case '-\[(?:\S+ )?(\S+)\]' started)/

/** Phases of the Gradle tasks `make check-android` runs, from `--console=plain` output. */
export const GRADLE_PHASES = [
  { match: /^> Task :app:compile\w*Kotlin/, phase: 'compiling' },
  { match: /^> Task :app:(dexBuilder|mergeProjectDex|package)\w*/, phase: 'packaging' },
  { match: /^> Task :app:test\w*UnitTest\b/, phase: 'running unit tests' },
  { match: /^> Task :app:install\w*/, phase: 'installing' },
]
