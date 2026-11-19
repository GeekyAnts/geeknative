import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { migrate } from '../src/commands/migrate.js'
import { readLock, setLockMigrations, writeLock } from '../src/lib/managed.js'
import { packageVersion } from '../src/lib/project.js'
import { tempDir, tempProject } from './helpers.js'

/** @param {string} root */
function gitInitCommit(root) {
  const run = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr || result.stdout)
  }
  run(['init'])
  run(['config', 'user.email', 'test@example.com'])
  run(['config', 'user.name', 'Test'])
  run(['add', '-A'])
  run(['commit', '-m', 'initial'])
}

/**
 * @param {import('../src/migrations/registry.js').Migration[]} list
 */
function projectWithLock(list = []) {
  const dir = tempProject(['AGENTS.md'])
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeLock(dir, packageVersion(), dir, { migrations: [] })
  writeFileSync(path.join(dir, 'note.txt'), 'before\n')
  gitInitCommit(dir)
  return dir
}

test('migrate refuses a project without lock.json', async () => {
  const dir = tempDir()
  mkdirSync(path.join(dir, 'contracts'))
  writeFileSync(path.join(dir, 'contracts', 'app.json'), '{}\n')
  spawnSync('git', ['init'], { cwd: dir })
  await assert.rejects(migrate(dir, { gen: false, list: [] }), /lock\.json/)
})

test('migrate refuses a dirty working tree', async () => {
  const dir = projectWithLock()
  writeFileSync(path.join(dir, 'dirty.txt'), 'x\n')
  await assert.rejects(migrate(dir, { gen: false, list: [] }), /dirty/)
})

test('migrate dry-run reports pending work and writes nothing', async () => {
  const dir = projectWithLock()
  const list = [
    {
      id: 'demo-scripted',
      since: '0.1.0',
      kind: /** @type {const} */ ('scripted'),
      title: 'Rewrite note',
      run: (root) => {
        writeFileSync(path.join(root, 'note.txt'), 'after\n')
        return { changed: ['note.txt'] }
      },
    },
  ]
  const before = readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8')
  const result = await migrate(dir, { dryRun: true, gen: false, list })
  assert.deepEqual(result.pending, ['demo-scripted'])
  assert.equal(readFileSync(path.join(dir, 'note.txt'), 'utf8'), 'before\n')
  assert.equal(readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8'), before)
})

test('migrate applies a scripted migration once and records it', async () => {
  const dir = projectWithLock()
  const list = [
    {
      id: 'demo-scripted',
      since: '0.1.0',
      kind: /** @type {const} */ ('scripted'),
      title: 'Rewrite note',
      run: (root) => {
        writeFileSync(path.join(root, 'note.txt'), 'after\n')
        return { changed: ['note.txt'] }
      },
    },
  ]
  const first = await migrate(dir, { gen: false, list })
  assert.deepEqual(first.applied, ['demo-scripted'])
  assert.equal(readFileSync(path.join(dir, 'note.txt'), 'utf8'), 'after\n')
  assert.deepEqual(readLock(dir)?.migrations, ['demo-scripted'])

  spawnSync('git', ['add', '-A'], { cwd: dir })
  spawnSync('git', ['commit', '-m', 'after migrate'], { cwd: dir })

  const second = await migrate(dir, { gen: false, list })
  assert.deepEqual(second.applied, [])
  assert.deepEqual(readLock(dir)?.migrations, ['demo-scripted'])
})

test('migrate prints a written migration and records it as surfaced', async () => {
  const dir = projectWithLock()
  const list = [
    {
      id: 'demo-written',
      since: '0.1.0',
      kind: /** @type {const} */ ('written'),
      title: 'Rename a screen',
      guide: 'Update iOS, Android and web together.',
    },
  ]
  const result = await migrate(dir, { gen: false, list })
  assert.deepEqual(result.written, ['demo-written'])
  assert.deepEqual(result.applied, [])
  assert.deepEqual(readLock(dir)?.migrations, ['demo-written'])
})

test('setLockMigrations leaves hashes and version alone', () => {
  const dir = tempProject(['AGENTS.md'])
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeLock(dir, '0.1.0', dir, { migrations: [] })
  const before = readLock(dir)
  setLockMigrations(dir, ['kept'])
  const after = readLock(dir)
  assert.equal(after?.geeknative, before?.geeknative)
  assert.deepEqual(after?.files, before?.files)
  assert.deepEqual(after?.blocks, before?.blocks)
  assert.deepEqual(after?.migrations, ['kept'])
})
