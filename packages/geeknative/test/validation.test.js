// Contract mistakes must fail with a message an agent can act on.
import assert from 'node:assert/strict'
import { renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { generate } from '../src/codegen/index.js'
import { CliError } from '../src/lib/log.js'
import { editJson, tempProject } from './helpers.js'

/** @typedef {(contracts: string) => void} Mutation */

/** @type {[string, Mutation, RegExp][]} */
const cases = [
  [
    'a malformed hex color',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => (t.color.primary.light = '#4F46E')),
    /color\.primary\.light must be a hex color/,
  ],
  [
    'a missing required color',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => delete t.color.outline),
    /missing required colors: outline/,
  ],
  [
    'a color named with a reserved word',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => (t.color.default = { light: '#000000' })),
    /reserved word/,
  ],
  [
    'an unknown Dynamic Type style',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => (t.typography.title.ios = 'huge')),
    /"ios" must be a Dynamic Type style/,
  ],
  [
    'an unknown Material type style',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => (t.typography.title.android = 'titleHuge')),
    /"android" must be a Material 3 type style/,
  ],
  [
    'a custom font family',
    (c) => editJson(path.join(c, 'tokens.json'), (t) => (t.font.family = 'Inter')),
    /isn't supported yet/,
  ],
  [
    'a badly formed string key',
    (c) => editJson(path.join(c, 'strings', 'en.json'), (s) => (s['Home.Title'] = 'x')),
    /keys are dot-separated camelCase words/,
  ],
  [
    'an app.name string',
    (c) => editJson(path.join(c, 'strings', 'en.json'), (s) => (s['app.name'] = 'x')),
    /comes from contracts\/app\.json/,
  ],
  [
    'two keys that collide in code',
    (c) => editJson(path.join(c, 'strings', 'en.json'), (s) => Object.assign(s, { 'a.bC': 'x', 'aB.c': 'y' })),
    /collides with/,
  ],
  [
    'a translation with different placeholders',
    (c) => writeFileSync(path.join(c, 'strings', 'fr.json'), JSON.stringify({ 'settings.about.version': 'Version {v}' })),
    /must use the same placeholders and plural shape/,
  ],
  [
    'a translation with a key the default locale lacks',
    (c) => writeFileSync(path.join(c, 'strings', 'fr.json'), JSON.stringify({ 'only.inFrench': 'x' })),
    /keys missing from en\.json: only\.inFrench/,
  ],
  [
    'a plural without an "other" form',
    (c) => editJson(path.join(c, 'strings', 'en.json'), (s) => (s['notes.count'] = { one: '{count} note' })),
    /plural strings need an "other" form/,
  ],
  [
    'a plural with a placeholder other than count',
    (c) => editJson(path.join(c, 'strings', 'en.json'), (s) => (s['notes.count'] = { other: '{n} notes' })),
    /can only use the \{count\} placeholder/,
  ],
  [
    'a missing default-locale strings file',
    (c) => renameSync(path.join(c, 'strings', 'en.json'), path.join(c, 'strings', 'de.json')),
    /strings\/en\.json is missing/,
  ],
  [
    'an icon with an invalid Material name',
    (c) => editJson(path.join(c, 'icons.json'), (i) => (i.star = { ios: 'star', android: 'Star', web: 'Star' })),
    /"star" needs "android"/,
  ],
  [
    'an icon missing its web name',
    (c) => editJson(path.join(c, 'icons.json'), (i) => (i.star = { ios: 'star', android: 'Icons.Filled.Star' })),
    /"star" needs "web"/,
  ],
  [
    'an app ID that is not reverse-DNS',
    (c) => editJson(path.join(c, 'app.json'), (a) => (a.id = 'myapp')),
    /reverse-DNS identifier/,
  ],
  [
    'a malformed version',
    (c) => editJson(path.join(c, 'app.json'), (a) => (a.version = 'v1')),
    /"version" must look like "1\.0\.0"/,
  ],
  [
    'a build number below 1',
    (c) => editJson(path.join(c, 'app.json'), (a) => (a.build = 0)),
    /"build" must be a whole number/,
  ],
  [
    'invalid JSON',
    (c) => writeFileSync(path.join(c, 'app.json'), '{'),
    /contracts\/app\.json is not valid JSON/,
  ],
  [
    'a missing contract file',
    (c) => rmSync(path.join(c, 'icons.json')),
    /contracts\/icons\.json is missing/,
  ],
]

for (const [name, mutate, message] of cases) {
  test(`rejects ${name}`, () => {
    const dir = tempProject()
    mutate(path.join(dir, 'contracts'))
    assert.throws(
      () => generate(dir),
      (error) => error instanceof CliError && message.test(error.message),
    )
  })
}
