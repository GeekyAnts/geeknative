import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { extractBlock, hashContent, MANAGED_BLOCK_FILES, MANAGED_DIRS, MANAGED_FILES, managedHashes, readLock, replaceBlock, writeLockFrom } from '../src/lib/managed.js'
import { tempDir, TEMPLATE, tempProject } from './helpers.js'

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

test('replaceBlock swaps the managed block and keeps the rest of the file', () => {
  const text = 'intro\n<!-- geeknative:begin (managed) -->\nold\n<!-- geeknative:end -->\n\n## Project rules\n- mine\n'
  const next = '<!-- geeknative:begin (managed) -->\n$&\n<!-- geeknative:end -->'
  assert.equal(
    replaceBlock(text, next),
    'intro\n<!-- geeknative:begin (managed) -->\n$&\n<!-- geeknative:end -->\n\n## Project rules\n- mine\n',
  )
  assert.equal(replaceBlock('no markers', next), null)
})

test('the lockfile records the template that was installed, not later project edits', () => {
  const project = tempDir()
  const source = tempDir()
  mkdirSync(path.join(source, '.geeknative'), { recursive: true })
  mkdirSync(path.join(project, '.geeknative'), { recursive: true })
  writeFileSync(path.join(source, '.geeknative', 'framework.mk'), 'shipped\n')
  writeFileSync(path.join(project, '.geeknative', 'framework.mk'), 'local\n')

  writeLockFrom(project, '0.2.0', source)
  const lock = readLock(project)
  assert.equal(lock.geeknative, '0.2.0')
  assert.equal(lock.files['.geeknative/framework.mk'], hashContent('shipped\n'))
  assert.deepEqual(lock.blocks, {})
})

test('readLock rejects a project with no lockfile', () => {
  assert.throws(() => readLock(tempDir()), /no \.geeknative\/lock\.json/)
})

test('readLock rejects a lockfile that is not geeknative\'s', () => {
  const dir = tempDir()
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeFileSync(path.join(dir, '.geeknative', 'lock.json'), '{}\n')
  assert.throws(() => readLock(dir), /not a geeknative lockfile/)
})
