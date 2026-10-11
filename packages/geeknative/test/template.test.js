// Consistency checks on the template every project starts from.
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { gen } from '../src/commands/gen.js'
import { readJson, TEMPLATE } from './helpers.js'

test('the generated code committed in the template is up to date', () => {
  assert.doesNotThrow(() => gen(TEMPLATE, { check: true, quiet: true }))
})

test('every CLAUDE.md imports its AGENTS.md', () => {
  for (const dir of ['', 'apps/ios', 'apps/android', 'apps/web']) {
    const claude = readFileSync(path.join(TEMPLATE, dir, 'CLAUDE.md'), 'utf8')
    assert.match(claude, /^@AGENTS\.md$/m, `${dir || 'root'} CLAUDE.md`)
    assert.ok(existsSync(path.join(TEMPLATE, dir, 'AGENTS.md')), `${dir || 'root'} AGENTS.md`)
  }
})

test('the root AGENTS.md links only to playbooks that exist', () => {
  const agents = readFileSync(path.join(TEMPLATE, 'AGENTS.md'), 'utf8')
  const playbooks = [...agents.matchAll(/\.geeknative\/playbooks\/([\w-]+\.md)/g)].map((m) => m[1])
  assert.ok(playbooks.length >= 5)
  for (const playbook of playbooks) {
    assert.ok(existsSync(path.join(TEMPLATE, '.geeknative', 'playbooks', playbook)), playbook)
  }
})

test('Claude Code hooks and subagents named in settings exist', () => {
  const settings = readJson(path.join(TEMPLATE, '.claude', 'settings.json'))
  const commands = Object.values(settings.hooks).flatMap((groups) =>
    /** @type {any[]} */ (groups).flatMap((group) => group.hooks.map((/** @type {any} */ hook) => hook.command)),
  )
  for (const command of commands) {
    const script = command.match(/\.geeknative\/hooks\/[\w-]+\.mjs/)?.[0]
    assert.ok(script && existsSync(path.join(TEMPLATE, script)), command)
  }
  for (const group of settings.hooks.SubagentStart) {
    assert.ok(existsSync(path.join(TEMPLATE, '.claude', 'agents', `${group.matcher}.md`)), group.matcher)
  }
})

test('acceptance criteria IDs in specs start with their feature ID', () => {
  const dir = path.join(TEMPLATE, 'spec', 'features')
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
    const text = readFileSync(path.join(dir, file), 'utf8')
    const id = text.match(/^id: ([\w-]+)$/m)?.[1]
    assert.ok(id, `${file} has an id`)
    for (const [ac] of text.matchAll(/AC-[a-z0-9-]+-\d+/g)) assert.ok(ac.startsWith(`AC-${id}-`), `${file}: ${ac}`)
  }
})

test('each app tests every Settings criterion', () => {
  const settings = readFileSync(path.join(TEMPLATE, 'spec', 'features', 'settings.md'), 'utf8')
  const criteria = [...new Set(settings.match(/AC-settings-\d+/g))]
  const tests = {
    ios: readFileSync(path.join(TEMPLATE, 'apps/ios/AppTests/SettingsTests.swift'), 'utf8'),
    android: readFileSync(path.join(TEMPLATE, 'apps/android/app/src/test/kotlin/app/features/settings/SettingsTest.kt'), 'utf8'),
    web: readFileSync(path.join(TEMPLATE, 'apps/web/src/features/settings/settings.test.ts'), 'utf8'),
  }
  for (const [platform, source] of Object.entries(tests)) {
    for (const criterion of criteria) assert.ok(source.includes(criterion), `${platform} misses ${criterion}`)
  }
})

test('the same storage key and values are used on every platform', () => {
  const sources = [
    'apps/ios/App/Features/Settings/Appearance.swift',
    'apps/android/app/src/main/kotlin/app/features/settings/Appearance.kt',
    'apps/web/src/features/settings/Appearance.ts',
  ].map((file) => readFileSync(path.join(TEMPLATE, file), 'utf8'))
  for (const source of sources) {
    assert.ok(source.includes('"settings.appearance"') || source.includes("'settings.appearance'"))
    for (const value of ['system', 'light', 'dark']) assert.match(source, new RegExp(`\\b${value}\\b`))
  }
})
