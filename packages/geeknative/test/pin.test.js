import assert from 'node:assert/strict'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { create } from '../src/commands/create.js'
import { pin } from '../src/commands/pin.js'
import { editJson, readJson, tempDir } from './helpers.js'

test('pin moves a project to a fresh snapshot of the checkout and removes the old one', async () => {
  const dir = path.join(tempDir(), 'pinned-app')
  await create(dir, { install: false, git: false })
  const current = readJson(path.join(dir, 'package.json')).devDependencies.geeknative

  // Pretend the project was pinned to an older commit.
  const old = '.geeknative/geeknative-0.1.1-0000000.tgz'
  writeFileSync(path.join(dir, old), '')
  editJson(path.join(dir, 'package.json'), (pkg) => (pkg.devDependencies.geeknative = `file:${old}`))

  await pin(dir, { install: false })
  assert.equal(readJson(path.join(dir, 'package.json')).devDependencies.geeknative, current)
  assert.ok(!existsSync(path.join(dir, old)), 'the old snapshot is removed')
  assert.deepEqual(readdirSync(path.join(dir, '.geeknative')).filter((f) => f.endsWith('.tgz')), [current.replace('file:.geeknative/', '')])

  // Pinning again to the same commit changes nothing.
  await pin(dir, { install: false })
  assert.equal(readJson(path.join(dir, 'package.json')).devDependencies.geeknative, current)
})
