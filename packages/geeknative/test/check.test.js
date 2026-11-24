import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveCheckRequest } from '../src/commands/check.js'
import { CliError } from '../src/lib/log.js'

test('--feature is rejected unless exactly one platform is named', () => {
  assert.throws(() => resolveCheckRequest(['ios', 'android'], 'settings'), CliError)
  assert.throws(() => resolveCheckRequest(['all'], 'settings'), CliError)
  assert.throws(() => resolveCheckRequest([], 'settings'), CliError)
  assert.deepEqual(resolveCheckRequest(['ios'], 'settings'), { everything: false, wanted: ['ios'], feature: 'settings' })
})

test('a full check still accepts every platform', () => {
  assert.deepEqual(resolveCheckRequest([], undefined).wanted, ['ios', 'android', 'web'])
  assert.equal(resolveCheckRequest(['contracts'], undefined).everything, false)
  assert.throws(() => resolveCheckRequest(['desktop'], undefined), CliError)
})
