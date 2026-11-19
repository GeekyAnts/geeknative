import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareSemver, knownMigrationIds, pending } from '../src/migrations/registry.js'

test('compareSemver orders dotted versions', () => {
  assert.ok(compareSemver('0.1.0', '0.1.1') < 0)
  assert.ok(compareSemver('0.2.0', '0.1.9') > 0)
  assert.equal(compareSemver('0.1.1', '0.1.1'), 0)
})

test('pending skips applied ids and migrations newer than the CLI', () => {
  const list = [
    { id: 'a', since: '0.1.0', kind: 'scripted', title: 'A' },
    { id: 'b', since: '0.2.0', kind: 'written', title: 'B' },
    { id: 'c', since: '0.3.0', kind: 'scripted', title: 'C' },
  ]
  assert.deepEqual(
    pending({ migrations: ['a'] }, '0.2.0', list).map((m) => m.id),
    ['b'],
  )
  assert.deepEqual(knownMigrationIds(list), ['a', 'b', 'c'])
})
