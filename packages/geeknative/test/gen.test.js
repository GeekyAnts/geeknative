import assert from 'node:assert/strict'
import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { gen } from '../src/commands/gen.js'
import { editJson, tempProject } from './helpers.js'

test('gen writes every output once, then has nothing to do', () => {
  const dir = tempProject()
  const first = gen(dir, { quiet: true })
  assert.ok(first.changed.length >= 21, `expected at least 21 files, got ${first.changed.length}`)
  assert.deepEqual(gen(dir, { quiet: true }), { changed: [], removed: [] })
  assert.doesNotThrow(() => gen(dir, { check: true, quiet: true }))
})

test('check mode fails when a generated file was edited by hand', () => {
  const dir = tempProject()
  gen(dir, { quiet: true })
  appendFileSync(path.join(dir, 'apps', 'ios', 'App', 'Generated', 'Strings.swift'), '\n// hand edit\n')
  assert.throws(() => gen(dir, { check: true, quiet: true }), /out of date[\s\S]*Strings\.swift[\s\S]*make gen/)
  gen(dir, { quiet: true })
  assert.doesNotThrow(() => gen(dir, { check: true, quiet: true }))
})

test('gen removes generated files that are no longer produced', () => {
  const dir = tempProject()
  const french = path.join(dir, 'contracts', 'strings', 'fr.json')
  writeFileSync(french, JSON.stringify({ 'settings.title': 'Réglages' }))
  gen(dir, { quiet: true })
  const frenchXml = path.join(dir, 'apps', 'android', 'app', 'src', 'main', 'res', 'values-fr', 'generated_strings.xml')
  assert.ok(existsSync(frenchXml))

  rmSync(french)
  const { removed } = gen(dir, { quiet: true })
  assert.deepEqual(removed, ['apps/android/app/src/main/res/values-fr/generated_strings.xml'])
  assert.ok(!existsSync(frenchXml))
})

test('gen leaves hand-written files alone, but owns the Generated folders', () => {
  const dir = tempProject()
  const themes = path.join(dir, 'apps', 'android', 'app', 'src', 'main', 'res', 'values', 'themes.xml')
  mkdirSync(path.dirname(themes), { recursive: true })
  writeFileSync(themes, '<resources />')
  const stray = path.join(dir, 'apps', 'ios', 'App', 'Generated', 'Mine.swift')
  mkdirSync(path.dirname(stray), { recursive: true })
  writeFileSync(stray, '// not generated')

  gen(dir, { quiet: true })
  assert.ok(existsSync(themes), 'hand-written resources next to generated ones survive')
  assert.ok(!existsSync(stray), 'files in a Generated folder are removed unless codegen produces them')
})

/** A project with one declared secret and no .env yet. */
function projectWithSecret() {
  const dir = tempProject()
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.secrets = { mapsApiKey: { type: 'string' } }
  })
  return dir
}

const swiftSecrets = (dir) => path.join(dir, 'apps', 'ios', 'App', 'Generated', 'AppSecrets.swift')
const webSecrets = (dir) => path.join(dir, 'apps', 'web', 'src', 'generated', 'secrets.server.ts')

test('check mode writes local secret files but never compares them', () => {
  const dir = projectWithSecret()
  gen(dir, { quiet: true })
  rmSync(swiftSecrets(dir))
  // Removing a local file is not "out of date": it is restored, and the check still passes.
  assert.doesNotThrow(() => gen(dir, { check: true, quiet: true }))
  assert.ok(existsSync(swiftSecrets(dir)), 'check mode rewrites the missing local file so builds compile')

  appendFileSync(swiftSecrets(dir), '\n// edited\n')
  assert.doesNotThrow(() => gen(dir, { check: true, quiet: true }))
})

test('check mode still compares the committed web secrets file', () => {
  const dir = projectWithSecret()
  gen(dir, { quiet: true })
  appendFileSync(webSecrets(dir), '\n// hand edit\n')
  assert.throws(() => gen(dir, { check: true, quiet: true }), /out of date[\s\S]*secrets\.server\.ts/)
})

test('a changed .env value shows up in the local file after gen', () => {
  const dir = projectWithSecret()
  writeFileSync(path.join(dir, '.env'), 'MAPS_API_KEY=one\n')
  gen(dir, { quiet: true })
  writeFileSync(path.join(dir, '.env'), 'MAPS_API_KEY=two\n')
  assert.deepEqual(gen(dir, { quiet: true }).changed, ['apps/ios/App/Generated/AppSecrets.swift', 'apps/android/app/src/main/kotlin/app/generated/AppSecrets.kt'])
})

test('removing the last secret removes its generated files, including .env.example', () => {
  const dir = projectWithSecret()
  gen(dir, { quiet: true })
  assert.ok(existsSync(path.join(dir, '.env.example')))
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => (config.secrets = {}))
  const { removed } = gen(dir, { quiet: true })
  assert.ok(removed.includes('.env.example'))
  assert.ok(removed.includes('apps/web/src/generated/secrets.server.ts'))
  assert.ok(!existsSync(swiftSecrets(dir)))
})

test('a hand-written .env.example is never removed', () => {
  const dir = tempProject()
  writeFileSync(path.join(dir, '.env.example'), 'MY_OWN_KEY=\n')
  assert.deepEqual(gen(dir, { quiet: true }).removed, [])
  assert.ok(existsSync(path.join(dir, '.env.example')))
})
