import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseDiagnostics } from '../src/lib/diagnostics.js'

const root = '/Users/me/app'
const ios = '/Users/me/app/apps/ios'

test('parses an Xcode error into a project-relative path', () => {
  const errors = parseDiagnostics(
    ['/Users/me/app/apps/ios/App/Features/Settings/SettingsViewModel.swift:42:17: error: cannot find SettingsRepository in scope'],
    root,
    ios,
  )
  assert.deepEqual(errors, [
    {
      file: 'apps/ios/App/Features/Settings/SettingsViewModel.swift',
      line: 42,
      message: 'cannot find SettingsRepository in scope',
    },
  ])
})

test('parses Kotlin compiler errors', () => {
  const errors = parseDiagnostics(
    [
      'e: file:///Users/me/app/apps/android/app/src/main/kotlin/app/features/settings/SettingsViewModel.kt:42:5 Cannot find SettingsRepository',
      'e: SettingsScreen.kt: (10, 8): Unresolved reference',
    ],
    root,
    '/Users/me/app/apps/android',
  )
  assert.equal(errors[0].file, 'apps/android/app/src/main/kotlin/app/features/settings/SettingsViewModel.kt')
  assert.equal(errors[0].line, 42)
  assert.match(errors[0].message, /Cannot find SettingsRepository/)
  assert.equal(errors[1].file, 'apps/android/SettingsScreen.kt')
  assert.equal(errors[1].line, 10)
  assert.equal(errors[1].message, 'Unresolved reference')
})

test('parses a TypeScript error', () => {
  const errors = parseDiagnostics(
    ['src/features/settings/SettingsScreen.tsx(42,5): error TS2322: Type string is not assignable to type number.'],
    root,
    root,
  )
  assert.deepEqual(errors, [
    {
      file: 'src/features/settings/SettingsScreen.tsx',
      line: 42,
      message: 'Type string is not assignable to type number.',
    },
  ])
})

test('parses a Vitest failure', () => {
  const errors = parseDiagnostics(
    [' FAIL  src/features/settings/settings.test.ts > AC-settings-1', 'AssertionError: expected system to be dark'],
    root,
    '/Users/me/app/apps/web',
  )
  assert.equal(errors.length, 1)
  assert.equal(errors[0].file, 'apps/web/src/features/settings/settings.test.ts')
  assert.equal(errors[0].line, 0)
  assert.match(errors[0].message, /AssertionError/)
})
