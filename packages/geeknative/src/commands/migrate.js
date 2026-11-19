// @ts-check
import { spawnSync } from 'node:child_process'
import { capture } from '../lib/exec.js'
import { CliError, log } from '../lib/log.js'
import { readLock, setLockMigrations } from '../lib/managed.js'
import { MIGRATIONS, pending } from '../migrations/registry.js'
import { packageVersion } from '../lib/project.js'
import { gen } from './gen.js'

/**
 * Applies pending project-owned migrations. Framework files stay with `upgrade`.
 *
 * @param {string} root
 * @param {{
 *   dryRun?: boolean,
 *   gen?: boolean,
 *   list?: import('../migrations/registry.js').Migration[],
 * }} [options]
 *   `list` is for tests; production uses the empty registry until a release ships entries.
 */
export async function migrate(root, { dryRun = false, gen: doGen = true, list = MIGRATIONS } = {}) {
  const lock = readLock(root)
  if (!lock) {
    throw new CliError(
      'No .geeknative/lock.json. This folder was not created by geeknative (or the lockfile was deleted).',
    )
  }

  assertCleanGit(root)

  const version = packageVersion()
  const waiting = pending(lock, version, list)
  if (!waiting.length) {
    log.ok('migrate', 'nothing to apply')
    return { applied: [], written: [], changed: [] }
  }

  if (dryRun) {
    log.step('migrate', `${waiting.length} migration(s) waiting`)
    for (const migration of waiting) {
      const verb = migration.kind === 'scripted' ? 'run' : 'print'
      log.detail(`${verb} ${migration.id}: ${migration.title}`)
    }
    return { applied: [], written: [], changed: [], pending: waiting.map((m) => m.id) }
  }

  /** @type {string[]} */
  const applied = [...lock.migrations]
  /** @type {string[]} */
  const scriptedIds = []
  /** @type {string[]} */
  const writtenIds = []
  /** @type {string[]} */
  const changed = []
  let regen = false

  for (const migration of waiting) {
    if (migration.kind === 'scripted') {
      if (typeof migration.run !== 'function') {
        throw new CliError(`Migration ${migration.id} is scripted but has no run().`)
      }
      const result = migration.run(root, { dryRun: false })
      changed.push(...(result.changed ?? []))
      if (result.regen) regen = true
      applied.push(migration.id)
      setLockMigrations(root, applied)
      scriptedIds.push(migration.id)
      log.ok('migrate', `applied ${migration.id}: ${migration.title}`)
      continue
    }

    log.step('migrate', `${migration.id}: ${migration.title}`)
    if (migration.guide) {
      for (const line of migration.guide.trim().split('\n')) log.detail(line)
    }
    log.detail('Apply this across all three apps, then commit. geeknative does not edit app code for written migrations.')
    applied.push(migration.id)
    setLockMigrations(root, applied)
    writtenIds.push(migration.id)
  }

  if (regen && doGen) gen(root, { quiet: true })
  log.ok('migrate', `${scriptedIds.length} scripted, ${writtenIds.length} written`)
  return { applied: scriptedIds, written: writtenIds, changed }
}

/** @param {string} root */
function assertCleanGit(root) {
  if (!capture('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'])) {
    throw new CliError(
      'No git repository. Initialize git and commit before migrate so you can restore if needed.',
    )
  }
  const status = spawnSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8', cwd: root })
  if (status.status !== 0) {
    throw new CliError('Could not read git status.')
  }
  if (status.stdout.trim()) {
    throw new CliError(
      'Working tree is dirty. Commit or stash your changes, then run geeknative migrate again.',
    )
  }
}
