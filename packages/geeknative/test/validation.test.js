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
  // contracts/config.json
  [
    'a missing config.json',
    (c) => rmSync(path.join(c, 'config.json')),
    /contracts\/config\.json is missing\. Create it with/,
  ],
  [
    'an unknown top-level config key',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => (cfg.value = {})),
    /unknown key "value"/,
  ],
  [
    'environments without production',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => (cfg.environments = ['development', 'staging'])),
    /must include "development" and "production"/,
  ],
  [
    'a duplicate environment',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => cfg.environments.push('staging')),
    /lists "staging" twice/,
  ],
  [
    'an environment that is not an identifier',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => cfg.environments.push('Dev-1')),
    /environment "Dev-1": names must be camelCase/,
  ],
  [
    'a config value with an unknown type',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => (cfg.values.timeout = { type: 'float' })),
    /values\.timeout "type" must be "string", "url", "boolean" or "int"/,
  ],
  [
    'a config value missing an environment',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.values.pageSize = { type: 'int', development: 10, production: 20 }
      }),
    /values\.pageSize is missing a value for "staging"/,
  ],
  [
    'a config value for an undeclared environment',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.values.pageSize = { type: 'int', development: 1, staging: 2, production: 3, qa: 4 }
      }),
    /values\.pageSize has "qa", which isn't in "environments"/,
  ],
  [
    'a config url that is not absolute',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.values.apiBaseUrl = { type: 'url', development: 'localhost:8080', staging: 'https://s.example.com', production: 'https://a.example.com' }
      }),
    /values\.apiBaseUrl\.development must be an absolute URL/,
  ],
  [
    'a config boolean that is not a boolean',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.values.beta = { type: 'boolean', development: 'yes', staging: true, production: false }
      }),
    /values\.beta\.development must be true or false/,
  ],
  [
    'a config int that is not whole',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.values.pageSize = { type: 'int', development: 1.5, staging: 2, production: 3 }
      }),
    /values\.pageSize\.development must be a whole number/,
  ],
  [
    'a secret that carries a value',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => (cfg.secrets.mapsApiKey = { type: 'string', value: 'abc' })),
    /secrets\.mapsApiKey has "value"\. Secrets are names only: put the value in \.env as MAPS_API_KEY/,
  ],
  [
    'a secret that is not a string',
    (c) => editJson(path.join(c, 'config.json'), (cfg) => (cfg.secrets.retries = { type: 'int' })),
    /secrets\.retries "type" must be "string"/,
  ],
  [
    'two secrets that map to one .env key',
    (c) =>
      editJson(path.join(c, 'config.json'), (cfg) => {
        cfg.secrets.apiKey = { type: 'string' }
        cfg.secrets.apiKEY = { type: 'string' }
      }),
    /"apiKey" and "apiKEY" both map to the \.env key API_KEY/,
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
