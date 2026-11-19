import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { extractBlock, MANAGED_BLOCK_FILES, MANAGED_DIRS, MANAGED_FILES, managedHashes, readLock, replaceBlock, writeLock } from '../src/lib/managed.js'
import { TEMPLATE, tempProject } from './helpers.js'

test('every framework-owned file and block exists in the template', () => {
  for (const dir of MANAGED_DIRS) {
    assert.ok(readdirSync(path.join(TEMPLATE, dir)).length > 0, `${dir} is empty`)
  }
  for (const file of MANAGED_FILES) assert.ok(existsSync(path.join(TEMPLATE, file)), `${file} is missing`)
  for (const file of MANAGED_BLOCK_FILES) {
    assert.ok(extractBlock(readFileSync(path.join(TEMPLATE, file), 'utf8')), `${file} has no geeknative block`)
  }
})

test('the managed block is found between its markers', () => {
  const text = 'intro\n<!-- geeknative:begin (managed) -->\nrules\n<!-- geeknative:end -->\n\n## Project rules\n- mine'
  assert.equal(extractBlock(text), '<!-- geeknative:begin (managed) -->\nrules\n<!-- geeknative:end -->')
  assert.equal(extractBlock('no markers here'), null)
})

test('project rules can change without touching the framework block hash', () => {
  const dir = tempProject(['AGENTS.md'])
  const file = path.join(dir, 'AGENTS.md')
  const before = managedHashes(dir).blocks['AGENTS.md']

  writeFileSync(file, `${readFileSync(file, 'utf8')}\n- Our brand voice is playful.\n`)
  assert.equal(managedHashes(dir).blocks['AGENTS.md'], before, 'editing Project rules keeps the block hash')

  writeFileSync(file, readFileSync(file, 'utf8').replace('# How to work in this repo', '# Edited'))
  assert.notEqual(managedHashes(dir).blocks['AGENTS.md'], before, 'editing inside the block changes its hash')
})

test('replaceBlock updates the markers and leaves project rules', () => {
  const text = '<!-- geeknative:begin -->\nold\n<!-- geeknative:end -->\n\n## Project rules\n- mine'
  assert.equal(
    replaceBlock(text, '<!-- geeknative:begin -->\nnew\n<!-- geeknative:end -->'),
    '<!-- geeknative:begin -->\nnew\n<!-- geeknative:end -->\n\n## Project rules\n- mine',
  )
})

test('replaceBlock inserts a missing block, after @AGENTS.md when present', () => {
  assert.equal(replaceBlock('## Project rules\n', '<!-- geeknative:begin -->\nx\n<!-- geeknative:end -->'), '<!-- geeknative:begin -->\nx\n<!-- geeknative:end -->\n## Project rules\n')
  assert.match(replaceBlock('@AGENTS.md\n\n', '<!-- geeknative:begin -->\nx\n<!-- geeknative:end -->'), /^@AGENTS.md\n\n<!-- geeknative:begin -->\nx\n<!-- geeknative:end -->/)
})

test('readLock returns null when the file is missing, and the written lock otherwise', () => {
  const dir = tempProject(['AGENTS.md'])
  assert.equal(readLock(dir), null)
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeLock(dir, '0.1.1')
  const lock = readLock(dir)
  assert.equal(lock?.geeknative, '0.1.1')
  assert.match(lock?.blocks['AGENTS.md'] ?? '', /^sha256-/)
})
