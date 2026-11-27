import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { migrate } from '../src/commands/migrate.js'
import { templateDir } from '../src/lib/project.js'
import { readLock, setLockMigrationState, writeLock } from '../src/lib/managed.js'
import { PENDING_MIGRATION_DOC } from '../src/migrations/pending-doc.js'
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

/** @param {string} root */
function gitCommitAll(root, message) {
  spawnSync('git', ['add', '-A'], { cwd: root })
  spawnSync('git', ['commit', '-m', message], { cwd: root })
}

function projectWithLock() {
  const dir = tempProject(['AGENTS.md'])
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeLock(dir, packageVersion(), dir, { migrations: [], migrationsPrepared: [] })
  writeFileSync(path.join(dir, 'note.txt'), 'before\n')
  gitInitCommit(dir)
  return dir
}

/** @returns {import('../src/migrations/registry.js').Migration} */
function agentMigration(id = 'demo-agent') {
  return {
    id,
    since: '0.1.0',
    kind: 'agent-assisted',
    title: 'Rename a screen',
    objective: 'Use the same screen name on every platform.',
    platforms: ['ios', 'android', 'web'],
    changes: ['Rename HomeScreen labels to MatchDay'],
    validation: ['make check passes on all three apps'],
    guide: 'Keep native navigation chrome.',
  }
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

test('migrate --status works on a dirty tree', async () => {
  const dir = projectWithLock()
  writeFileSync(path.join(dir, 'dirty.txt'), 'x\n')
  const result = await migrate(dir, { status: true, list: [agentMigration()] })
  assert.equal(result.statuses?.[0]?.status, 'pending')
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
    agentMigration(),
  ]
  const before = readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8')
  const result = await migrate(dir, { dryRun: true, gen: false, list })
  assert.deepEqual(result.pending, ['demo-scripted', 'demo-agent'])
  assert.equal(readFileSync(path.join(dir, 'note.txt'), 'utf8'), 'before\n')
  assert.equal(readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8'), before)
  assert.equal(existsSync(path.join(dir, PENDING_MIGRATION_DOC)), false)
})

test('migrate applies a scripted migration once and records it completed', async () => {
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

  gitCommitAll(dir, 'after migrate')

  const second = await migrate(dir, { gen: false, list })
  assert.deepEqual(second.applied, [])
  assert.deepEqual(readLock(dir)?.migrations, ['demo-scripted'])
})

test('migrate prepares agent-assisted work without completing it', async () => {
  const dir = projectWithLock()
  const list = [agentMigration()]
  const result = await migrate(dir, { gen: false, list })
  assert.deepEqual(result.prepared, ['demo-agent'])
  assert.deepEqual(result.applied, [])
  assert.deepEqual(readLock(dir)?.migrations, [])
  assert.deepEqual(readLock(dir)?.migrationsPrepared, ['demo-agent'])

  const doc = readFileSync(path.join(dir, PENDING_MIGRATION_DOC), 'utf8')
  assert.match(doc, /demo-agent/)
  assert.match(doc, /Objective/)
  assert.match(doc, /ios, android, web/)
  assert.match(doc, /Rename HomeScreen/)
  assert.match(doc, /make check passes/)
  assert.match(doc, /does \*\*not\*\* invoke/)
})

test('migrate --complete works on a dirty tree', async () => {
  const dir = projectWithLock()
  const list = [agentMigration()]
  await migrate(dir, { gen: false, list })
  writeFileSync(path.join(dir, 'agent-edit.txt'), 'applied\n')

  const result = await migrate(dir, { complete: 'demo-agent', list })
  assert.equal(result.completed, 'demo-agent')
  assert.deepEqual(readLock(dir)?.migrations, ['demo-agent'])
  assert.deepEqual(readLock(dir)?.migrationsPrepared, [])
  assert.equal(existsSync(path.join(dir, PENDING_MIGRATION_DOC)), false)
  assert.equal(readFileSync(path.join(dir, 'agent-edit.txt'), 'utf8'), 'applied\n')
})

test('migrate --complete marks agent-assisted work done and refreshes the doc', async () => {
  const dir = projectWithLock()
  const list = [agentMigration('one'), agentMigration('two')]
  list[1].title = 'Second migration'
  await migrate(dir, { gen: false, list })
  gitCommitAll(dir, 'prepared')

  const result = await migrate(dir, { complete: 'one', list })
  assert.equal(result.completed, 'one')
  assert.deepEqual(readLock(dir)?.migrations, ['one'])
  assert.deepEqual(readLock(dir)?.migrationsPrepared, ['two'])
  const doc = readFileSync(path.join(dir, PENDING_MIGRATION_DOC), 'utf8')
  assert.doesNotMatch(doc, /`one`/)
  assert.match(doc, /`two`/)

  gitCommitAll(dir, 'completed one')
  await migrate(dir, { complete: 'two', list })
  assert.deepEqual(readLock(dir)?.migrations, ['one', 'two'])
  assert.deepEqual(readLock(dir)?.migrationsPrepared, [])
  assert.equal(existsSync(path.join(dir, PENDING_MIGRATION_DOC)), false)
})

test('migrate --complete refuses scripted ids', async () => {
  const dir = projectWithLock()
  const list = [
    {
      id: 'demo-scripted',
      since: '0.1.0',
      kind: /** @type {const} */ ('scripted'),
      title: 'Rewrite note',
      run: () => ({ changed: [] }),
    },
  ]
  await assert.rejects(migrate(dir, { complete: 'demo-scripted', list }), /scripted/)
})

test('contracts-config writes the template starter only when missing', async () => {
  const dir = projectWithLock()
  const dest = path.join(dir, 'contracts', 'config.json')
  const starter = readFileSync(path.join(templateDir(), 'contracts', 'config.json'))

  const created = await migrate(dir, { gen: false })
  assert.deepEqual(created.applied, ['contracts-config', 'system-font-type-sizes'])
  assert.deepEqual(created.changed, ['contracts/config.json'])
  assert.deepEqual(readFileSync(dest), starter)
  assert.deepEqual(readLock(dir)?.migrations, ['contracts-config', 'system-font-type-sizes'])

  gitCommitAll(dir, 'seeded config')
  writeFileSync(dest, '{"environments":["development","production"],"values":{"kept":true},"secrets":{}}\n')
  gitCommitAll(dir, 'custom config')
  setLockMigrationState(dir, { migrations: [], migrationsPrepared: [] })
  gitCommitAll(dir, 'reset lock')

  const kept = readFileSync(dest, 'utf8')
  const skipped = await migrate(dir, { gen: false })
  assert.deepEqual(skipped.applied, ['contracts-config', 'system-font-type-sizes'])
  assert.deepEqual(skipped.changed, [])
  assert.equal(readFileSync(dest, 'utf8'), kept)
  assert.deepEqual(readLock(dir)?.migrations, ['contracts-config', 'system-font-type-sizes'])
})

test('system-font-type-sizes rewrites only a system font whose sizes disagree', async () => {
  const tokens = (font, bodySize, labelSize) =>
    `${JSON.stringify({
      typography: {
        body: { size: bodySize, lineHeight: 24, weight: 400, ios: 'body' },
        label: { size: labelSize, lineHeight: 20, weight: 500, ios: 'subheadline' },
      },
      ...(font ? { font } : {}),
    })}\n`

  const system = projectWithLock()
  mkdirSync(path.join(system, 'contracts'), { recursive: true })
  writeFileSync(path.join(system, 'contracts', 'config.json'), '{}\n')
  writeFileSync(path.join(system, 'contracts', 'tokens.json'), tokens({ family: 'system' }, 16, 14))
  gitCommitAll(system, 'system font')
  const rewritten = await migrate(system, { gen: false })
  assert.ok(rewritten.applied.includes('system-font-type-sizes'))
  assert.deepEqual(rewritten.changed, ['contracts/tokens.json'])
  const after = JSON.parse(readFileSync(path.join(system, 'contracts', 'tokens.json'), 'utf8'))
  assert.equal(after.typography.body.size, 17)
  assert.equal(after.typography.body.lineHeight, 24)
  assert.equal(after.typography.label.size, 15)
  assert.deepEqual(readLock(system)?.migrations, ['contracts-config', 'system-font-type-sizes'])

  const shared = projectWithLock()
  mkdirSync(path.join(shared, 'contracts'), { recursive: true })
  const inter = tokens({ family: 'Inter' }, 16, 14)
  writeFileSync(path.join(shared, 'contracts', 'config.json'), '{}\n')
  writeFileSync(path.join(shared, 'contracts', 'tokens.json'), inter)
  gitCommitAll(shared, 'inter')
  const left = await migrate(shared, { gen: false })
  assert.deepEqual(left.changed, [])
  assert.equal(readFileSync(path.join(shared, 'contracts', 'tokens.json'), 'utf8'), inter)

  const aligned = projectWithLock()
  mkdirSync(path.join(aligned, 'contracts'), { recursive: true })
  const matching = tokens(undefined, 17, 15)
  writeFileSync(path.join(aligned, 'contracts', 'config.json'), '{}\n')
  writeFileSync(path.join(aligned, 'contracts', 'tokens.json'), matching)
  gitCommitAll(aligned, 'aligned')
  const same = await migrate(aligned, { gen: false })
  assert.deepEqual(same.changed, [])
  assert.equal(readFileSync(path.join(aligned, 'contracts', 'tokens.json'), 'utf8'), matching)
})

test('setLockMigrationState leaves hashes and version alone', () => {
  const dir = tempProject(['AGENTS.md'])
  mkdirSync(path.join(dir, '.geeknative'), { recursive: true })
  writeLock(dir, '0.1.0', dir, { migrations: [], migrationsPrepared: [] })
  const before = readLock(dir)
  setLockMigrationState(dir, { migrations: ['kept'], migrationsPrepared: ['prep'] })
  const after = readLock(dir)
  assert.equal(after?.geeknative, before?.geeknative)
  assert.deepEqual(after?.files, before?.files)
  assert.deepEqual(after?.blocks, before?.blocks)
  assert.deepEqual(after?.migrations, ['kept'])
  assert.deepEqual(after?.migrationsPrepared, ['prep'])
})
