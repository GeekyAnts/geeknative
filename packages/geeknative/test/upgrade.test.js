import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { create } from '../src/commands/create.js'
import { decide, upgrade } from '../src/commands/upgrade.js'
import { hashContent, MANAGED_BLOCK_FILES, MANAGED_DIRS, MANAGED_FILES, readLock, writeLock } from '../src/lib/managed.js'
import { packageVersion } from '../src/lib/project.js'
import { editJson, readJson, TEMPLATE, tempDir } from './helpers.js'

const quiet = { install: false, pin: false, gen: false }

test('decide: replace untouched, keep only-ours, merge when both changed', () => {
  const old = 'line one\n'
  const lock = hashContent(old)
  assert.equal(decide(lock, old, old), 'skip')
  assert.equal(decide(lock, old, 'incoming\n'), 'replace')
  assert.equal(decide(lock, 'local\n', old), 'keep')
  assert.equal(decide(lock, 'local\n', 'incoming\n'), 'merge')
  assert.equal(decide(undefined, undefined, 'new\n'), 'add')
  assert.equal(decide(lock, old, undefined), 'remove')
  assert.equal(decide(lock, 'local\n', undefined), 'keep')
})

test('upgrade refuses a project without lock.json', async () => {
  const dir = tempDir()
  mkdirSync(path.join(dir, 'contracts'))
  writeFileSync(path.join(dir, 'contracts', 'app.json'), '{}\n')
  await assert.rejects(upgrade(dir, quiet), /lock\.json/)
})

test('upgrade is a no-op when the project already matches this CLI', async () => {
  const dir = path.join(tempDir(), 'fresh')
  await create(dir, { install: false, git: false })
  const before = readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8')
  const result = await upgrade(dir, quiet)
  assert.deepEqual(result, { changed: [], conflicts: [] })
  assert.equal(readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8'), before)
})

test('upgrade replaces an untouched framework file and leaves project rules', async () => {
  const dir = path.join(tempDir(), 'rules')
  await create(dir, { install: false, git: false })
  const agents = path.join(dir, 'AGENTS.md')
  writeFileSync(agents, `${readFileSync(agents, 'utf8')}\n- Brand voice is playful.\n`)

  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, '.geeknative', 'playbooks', 'feature.md'), `${readFileSync(path.join(incoming, '.geeknative', 'playbooks', 'feature.md'), 'utf8')}\n\n## Extra verify step\n`)
  writeFileSync(
    path.join(incoming, 'AGENTS.md'),
    readFileSync(path.join(incoming, 'AGENTS.md'), 'utf8').replace('# How to work in this repo', '# How to work in this upgraded repo'),
  )

  const result = await upgrade(dir, { ...quiet, incoming, previous: TEMPLATE })
  assert.ok(result.changed.includes('.geeknative/playbooks/feature.md'))
  assert.ok(result.changed.includes('AGENTS.md'))
  assert.equal(result.conflicts.length, 0)
  assert.match(readFileSync(path.join(dir, '.geeknative', 'playbooks', 'feature.md'), 'utf8'), /Extra verify step/)
  const text = readFileSync(agents, 'utf8')
  assert.match(text, /How to work in this upgraded repo/)
  assert.match(text, /Brand voice is playful/)
  assert.equal(readLock(dir)?.geeknative, packageVersion())
})

test('upgrade dry-run reports changes and writes nothing', async () => {
  const dir = path.join(tempDir(), 'dry')
  await create(dir, { install: false, git: false })
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, '.geeknative', 'framework.mk'), '# incoming\n')
  const makefile = readFileSync(path.join(dir, '.geeknative', 'framework.mk'), 'utf8')
  const lock = readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8')

  const result = await upgrade(dir, { ...quiet, incoming, previous: TEMPLATE, dryRun: true })
  assert.ok(result.changed.includes('.geeknative/framework.mk'))
  assert.equal(readFileSync(path.join(dir, '.geeknative', 'framework.mk'), 'utf8'), makefile)
  assert.equal(readFileSync(path.join(dir, '.geeknative', 'lock.json'), 'utf8'), lock)
})

test('upgrade three-way merges a locally edited playbook', async () => {
  const dir = path.join(tempDir(), 'merge')
  await create(dir, { install: false, git: false })
  const relative = '.geeknative/playbooks/bug.md'
  const previous = copyManaged(tempDir())
  writeFileSync(path.join(previous, relative), 'line one\nline two\nline three\n')
  writeFileSync(path.join(dir, relative), 'line one\nline local\nline three\n')
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, relative), 'line one\nline two\nline three\nline extra\n')
  writeLock(dir, '0.0.1', previous)

  const result = await upgrade(dir, { ...quiet, incoming, previous })
  assert.deepEqual(result.conflicts, [])
  assert.ok(result.changed.includes(relative))
  assert.equal(readFileSync(path.join(dir, relative), 'utf8'), 'line one\nline local\nline three\nline extra\n')
})

test('upgrade records a conflict and writes a sibling incoming file', async () => {
  const dir = path.join(tempDir(), 'conflict')
  await create(dir, { install: false, git: false })
  const relative = '.geeknative/playbooks/bug.md'
  const previous = copyManaged(tempDir())
  writeFileSync(path.join(previous, relative), 'shared\n')
  writeFileSync(path.join(dir, relative), 'ours\n')
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, relative), 'theirs\n')
  writeLock(dir, '0.0.1', previous)

  const result = await upgrade(dir, { ...quiet, incoming, previous })
  assert.deepEqual(result.conflicts, [relative])
  assert.equal(readFileSync(path.join(dir, relative), 'utf8'), 'ours\n')
  assert.equal(readFileSync(path.join(dir, `${relative}.geeknative-new`), 'utf8'), 'theirs\n')
  assert.equal(readLock(dir)?.geeknative, '0.0.1')
})

test('upgrade keeps a hand-resolved file and drops the sibling on rerun', async () => {
  const dir = path.join(tempDir(), 'resolved')
  await create(dir, { install: false, git: false })
  const relative = '.geeknative/playbooks/bug.md'
  const previous = copyManaged(tempDir())
  writeFileSync(path.join(previous, relative), 'shared\n')
  writeFileSync(path.join(dir, relative), 'ours\n')
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, relative), 'theirs\n')
  writeLock(dir, '0.0.1', previous)

  const conflict = await upgrade(dir, { ...quiet, incoming, previous })
  assert.deepEqual(conflict.conflicts, [relative])
  assert.equal(readLock(dir)?.geeknative, '0.0.1')

  writeFileSync(path.join(dir, relative), 'ours and theirs\n')
  const result = await upgrade(dir, { ...quiet, incoming, previous })
  assert.deepEqual(result.conflicts, [])
  assert.equal(readFileSync(path.join(dir, relative), 'utf8'), 'ours and theirs\n')
  assert.ok(!existsSync(path.join(dir, `${relative}.geeknative-new`)))
  assert.equal(readLock(dir)?.geeknative, packageVersion())
  assert.equal(readLock(dir)?.files[relative], hashContent('theirs\n'))
})

test('upgrade --force takes the incoming file on conflict', async () => {
  const dir = path.join(tempDir(), 'force')
  await create(dir, { install: false, git: false })
  const relative = '.geeknative/playbooks/bug.md'
  const previous = copyManaged(tempDir())
  writeFileSync(path.join(previous, relative), 'shared\n')
  writeFileSync(path.join(dir, relative), 'ours\n')
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, relative), 'theirs\n')
  writeLock(dir, '0.0.1', previous)

  const result = await upgrade(dir, { ...quiet, incoming, previous, force: true })
  assert.deepEqual(result.conflicts, [])
  assert.equal(readFileSync(path.join(dir, relative), 'utf8'), 'theirs\n')
  assert.ok(!existsSync(path.join(dir, `${relative}.geeknative-new`)))
})

test('upgrade bumps a registry dependency without packing a snapshot', async () => {
  const dir = path.join(tempDir(), 'npm-app')
  await create(dir, { install: false, git: false })
  editJson(path.join(dir, 'package.json'), (pkg) => {
    pkg.devDependencies.geeknative = '^0.0.1'
  })
  const incoming = copyManaged(tempDir())
  writeFileSync(path.join(incoming, '.geeknative', 'framework.mk'), `${readFileSync(path.join(incoming, '.geeknative', 'framework.mk'), 'utf8')}\n# bump\n`)

  await upgrade(dir, { ...quiet, incoming, previous: TEMPLATE })
  assert.equal(readJson(path.join(dir, 'package.json')).devDependencies.geeknative, `^${packageVersion()}`)
})

/** Copy framework-owned template files into `dir`. @param {string} dir */
function copyManaged(dir) {
  for (const folder of MANAGED_DIRS) {
    const src = path.join(TEMPLATE, folder)
    if (existsSync(src)) cpSync(src, path.join(dir, folder), { recursive: true })
  }
  for (const file of [...MANAGED_FILES, ...MANAGED_BLOCK_FILES]) {
    const src = path.join(TEMPLATE, file)
    if (!existsSync(src)) continue
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    cpSync(src, path.join(dir, file))
  }
  return dir
}
