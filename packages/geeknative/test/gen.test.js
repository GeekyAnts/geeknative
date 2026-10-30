import assert from 'node:assert/strict'
import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { gen } from '../src/commands/gen.js'
import { tempProject } from './helpers.js'

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
