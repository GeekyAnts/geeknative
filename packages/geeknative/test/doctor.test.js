import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { geeknativeSource } from '../src/commands/doctor.js'
import { tempDir } from './helpers.js'

test('doctor: tells a live link to a checkout from a pinned snapshot and an npm version', () => {
  const root = tempDir()
  const checkout = path.join(tempDir(), 'geeknative')
  mkdirSync(checkout)
  mkdirSync(path.join(root, '.geeknative'))
  writeFileSync(path.join(root, '.geeknative', 'geeknative-0.1.1-abc1234.tgz'), '')

  assert.deepEqual(geeknativeSource(`file:${checkout}`, root), { kind: 'linked', target: checkout })
  assert.deepEqual(geeknativeSource('file:.geeknative/geeknative-0.1.1-abc1234.tgz', root), {
    kind: 'snapshot',
    target: path.join(root, '.geeknative', 'geeknative-0.1.1-abc1234.tgz'),
  })
  assert.deepEqual(geeknativeSource('^0.1.1', root), { kind: 'registry', target: '^0.1.1' })
  assert.deepEqual(geeknativeSource(undefined, root), { kind: 'missing' })
})
