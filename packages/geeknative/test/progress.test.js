import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProgress, GRADLE_PHASES, XCODE_PASSED, XCODE_PHASES } from '../src/lib/progress.js'

/** A progress reporter on a fake clock, recording what it prints. */
function fakeProgress(options) {
  let time = 0
  /** @type {() => void} */
  let tick = () => {}
  const printed = []
  const progress = createProgress({
    ...options,
    now: () => time,
    print: (message) => printed.push(message),
    schedule: (callback) => ((tick = callback), { stop: () => (tick = () => {}) }),
  })
  return { progress, printed, advance: (seconds) => ((time += seconds * 1000), tick()) }
}

test('progress: prints each xcodebuild phase once, as it starts', () => {
  const { progress, printed, advance } = fakeProgress({ phases: XCODE_PHASES, passed: XCODE_PASSED })
  progress.onLine('Resolve Package Graph')
  advance(5)
  progress.onLine('SwiftCompile normal arm64 Compiling HomeScreen.swift')
  progress.onLine('SwiftCompile normal arm64 Compiling SettingsScreen.swift')
  advance(40)
  progress.onLine('Ld /path/App.app/App normal')
  progress.onLine('Testing started')
  progress.onLine("Test suite 'HomeTests' started on 'iPhone'")
  progress.onLine("Test case 'HomeTests/showsAppName()' passed on 'iPhone' (0.02 seconds)")
  progress.onLine('✔ Test "AC-home-2: shows the welcome card" passed after 0.002 seconds.')
  progress.onLine("Test Case '-[AppUITests testOpensSettings]' passed (4.1 seconds).")
  progress.onLine('✔ Suite "Home" passed after 0.011 seconds.')
  advance(30)
  progress.stop()
  advance(30)

  assert.deepEqual(printed, [
    'compiling… (5s)',
    'still compiling… (45s)',
    'linking… (45s)',
    'running tests… (45s)',
    'still running tests… (75s, 3 tests passed so far)',
  ])
})

test('progress: phases only move forward, as Xcode builds the app and then its tests', () => {
  const { progress, printed } = fakeProgress({ phases: XCODE_PHASES })
  for (const line of ['SwiftCompile normal arm64 A.swift', 'Ld App', 'SwiftCompile normal arm64 ATests.swift', 'Ld AppTests', 'Testing started']) {
    progress.onLine(line)
  }
  assert.deepEqual(printed, ['compiling… (0s)', 'linking… (0s)', 'running tests… (0s)'])
})

test('progress: tests start in any of the forms xcodebuild prints', () => {
  for (const line of ["Test Suite 'All tests' started at 2026-10-30", '◇ Test run started.', "Test suite 'HomeTests' started on 'iPhone'", 'Testing started']) {
    const { progress, printed } = fakeProgress({ phases: XCODE_PHASES })
    progress.onLine(line)
    assert.deepEqual(printed, ['running tests… (0s)'], line)
  }
})

test('progress: the heartbeat says nothing before the first phase', () => {
  const { printed, advance } = fakeProgress({ phases: XCODE_PHASES })
  advance(30)
  assert.deepEqual(printed, [])
})

test('progress: Gradle tasks map onto compiling, packaging and unit tests', () => {
  const { progress, printed } = fakeProgress({ phases: GRADLE_PHASES })
  for (const line of [
    '> Task :app:preBuild UP-TO-DATE',
    '> Task :app:compileDebugKotlin',
    '> Task :app:compileDebugUnitTestKotlin',
    '> Task :app:dexBuilderDebug',
    '> Task :app:testDebugUnitTest',
  ]) progress.onLine(line)
  assert.deepEqual(printed, ['compiling… (0s)', 'packaging… (0s)', 'running unit tests… (0s)'])
})
