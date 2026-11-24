import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderContext } from '../src/commands/context.js'
import { CliError } from '../src/lib/log.js'
import { TEMPLATE, tempProject } from './helpers.js'

test('the iOS settings pack points at one reference and no other app', () => {
  const pack = renderContext(TEMPLATE, 'settings', 'ios')

  assert.match(pack, /spec\/features\/settings\.md/)
  assert.match(pack, /AC-settings-1/)
  assert.match(pack, /apps\/ios\/App\/Features\/Settings\/SettingsScreen\.swift/)
  assert.match(pack, /Reference:\napps\/ios\/App\/Features\/Home/)
  assert.match(pack, /- settings\.title/)
  assert.match(pack, /- common\.back/)
  assert.match(pack, /- settings\.appearance\.title/)
  assert.doesNotMatch(pack, /home\.welcomeTitle/)
  assert.match(pack, /apps\/ios\/App\/Core\/Navigation\/Route\.swift/)
  assert.match(pack, /apps\/ios\/AppTests\/SettingsTests\.swift/)
  assert.match(pack, /geeknative check ios --feature settings/)
  assert.match(pack, /\.geeknative\/logs\/ios\.json/)
  assert.doesNotMatch(pack, /apps\/android/)
  assert.doesNotMatch(pack, /apps\/web/)
})

test('a feature with no folder lists the files to create', () => {
  const dir = tempProject(['spec', 'contracts'])
  const pack = renderContext(dir, 'settings', 'ios')

  assert.match(pack, /apps\/ios\/App\/Features\/Settings\/SettingsScreen\.swift/)
  assert.match(pack, /apps\/ios\/App\/Features\/Settings\/SettingsViewModel\.swift/)
  assert.match(pack, /apps\/ios\/App\/Features\/Settings\/SettingsRepository\.swift/)
  assert.match(pack, /None\. Follow apps\/ios\/AGENTS\.md/)
})

test('an unknown feature names the missing spec', () => {
  assert.throws(() => renderContext(TEMPLATE, 'missing', 'ios'), (error) => {
    assert.ok(error instanceof CliError)
    assert.match(error.message, /spec\/features\/missing\.md/)
    return true
  })
})

test('context requires one platform', () => {
  assert.throws(() => renderContext(TEMPLATE, 'settings', undefined), CliError)
  assert.throws(() => renderContext(TEMPLATE, 'settings', 'desktop'), CliError)
})
