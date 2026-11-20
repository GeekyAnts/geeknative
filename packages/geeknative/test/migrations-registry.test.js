import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  compareSemver,
  knownMigrationIds,
  migrationStatus,
  pending,
  statuses,
} from '../src/migrations/registry.js'

test('compareSemver orders dotted versions', () => {
  assert.ok(compareSemver('0.1.0', '0.1.1') < 0)
  assert.ok(compareSemver('0.2.0', '0.1.9') > 0)
  assert.equal(compareSemver('0.1.1', '0.1.1'), 0)
})

test('pending skips completed ids and migrations newer than the CLI', () => {
  const list = [
    { id: 'a', since: '0.1.0', kind: /** @type {const} */ ('scripted'), title: 'A' },
    { id: 'b', since: '0.2.0', kind: /** @type {const} */ ('agent-assisted'), title: 'B' },
    { id: 'c', since: '0.3.0', kind: /** @type {const} */ ('scripted'), title: 'C' },
  ]
  assert.deepEqual(
    pending({ migrations: ['a'], migrationsPrepared: ['b'] }, '0.2.0', list).map((m) => m.id),
    ['b'],
  )
  assert.deepEqual(knownMigrationIds(list), ['a', 'b', 'c'])
})

test('migrationStatus distinguishes pending, prepared, and completed', () => {
  const migration = {
    id: 'b',
    since: '0.1.0',
    kind: /** @type {const} */ ('agent-assisted'),
    title: 'B',
  }
  assert.equal(migrationStatus({ migrations: [], migrationsPrepared: [] }, migration), 'pending')
  assert.equal(migrationStatus({ migrations: [], migrationsPrepared: ['b'] }, migration), 'prepared')
  assert.equal(migrationStatus({ migrations: ['b'], migrationsPrepared: ['b'] }, migration), 'completed')
})

test('statuses lists migrations at or before the CLI version', () => {
  const list = [
    { id: 'a', since: '0.1.0', kind: /** @type {const} */ ('scripted'), title: 'A' },
    { id: 'b', since: '0.2.0', kind: /** @type {const} */ ('agent-assisted'), title: 'B' },
  ]
  const rows = statuses({ migrations: ['a'], migrationsPrepared: [] }, '0.2.0', list)
  assert.deepEqual(
    rows.map((row) => [row.id, row.status]),
    [
      ['a', 'completed'],
      ['b', 'pending'],
    ],
  )
})
