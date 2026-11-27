// @ts-check
import { spawnSync } from 'node:child_process'
import { capture } from '../lib/exec.js'
import { CliError, log } from '../lib/log.js'
import { readLock, setLockMigrationState } from '../lib/managed.js'
import { PENDING_MIGRATION_DOC, syncPendingMigrationDoc } from '../migrations/pending-doc.js'
import {
  MIGRATIONS,
  compareSemver,
  isAgentAssisted,
  pending,
  statuses,
} from '../migrations/registry.js'
import { packageVersion } from '../lib/project.js'
import { gen } from './gen.js'

/**
 * Applies pending project-owned migrations. Framework files stay with `upgrade`.
 * Does not invoke any AI agent: agent-assisted work is written to
 * `.geeknative/migrations/pending/MIGRATION.md` for the user to hand to an agent.
 *
 * @param {string} root
 * @param {{
 *   dryRun?: boolean,
 *   status?: boolean,
 *   complete?: string,
 *   gen?: boolean,
 *   list?: import('../migrations/registry.js').Migration[],
 * }} [options]
 *   `list` is for tests; production uses `MIGRATIONS`.
 */
export async function migrate(
  root,
  { dryRun = false, status = false, complete, gen: doGen = true, list = MIGRATIONS } = {},
) {
  const lock = readLock(root)
  if (!lock) {
    throw new CliError(
      'No .geeknative/lock.json. This folder was not created by geeknative (or the lockfile was deleted).',
    )
  }

  if (status && complete) {
    throw new CliError('Use either --status or --complete <id>, not both.')
  }

  const version = packageVersion()

  if (status) {
    return showStatus(lock, version, list)
  }

  // --complete only updates lock.json and MIGRATION.md, so it can follow
  // uncommitted agent edits. Scripted apply and prepare rewrite project files.
  if (complete) {
    return completeMigration(root, lock, version, complete, list, { dryRun })
  }

  assertCleanGit(root)

  const waiting = pending(lock, version, list)
  if (!waiting.length) {
    // Still refresh/remove the pending doc if everything is completed.
    if (!dryRun) syncPendingMigrationDoc(root, [])
    log.ok('migrate', 'nothing to apply')
    return { applied: [], prepared: [], changed: [] }
  }

  if (dryRun) {
    log.step('migrate', `${waiting.length} migration(s) waiting`)
    for (const migration of waiting) {
      const verb = migration.kind === 'scripted' ? 'run' : 'prepare'
      const state = (lock.migrationsPrepared ?? []).includes(migration.id) ? ' (already prepared)' : ''
      log.detail(`${verb} ${migration.id}: ${migration.title}${state}`)
    }
    return { applied: [], prepared: [], changed: [], pending: waiting.map((m) => m.id) }
  }

  /** @type {string[]} */
  const completed = [...lock.migrations]
  /** @type {string[]} */
  const prepared = [...(lock.migrationsPrepared ?? [])]
  /** @type {string[]} */
  const scriptedIds = []
  /** @type {string[]} */
  const preparedIds = []
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
      completed.push(migration.id)
      // Drop from prepared if it was somehow listed there.
      const preparedIndex = prepared.indexOf(migration.id)
      if (preparedIndex >= 0) prepared.splice(preparedIndex, 1)
      setLockMigrationState(root, { migrations: completed, migrationsPrepared: prepared })
      scriptedIds.push(migration.id)
      log.ok('migrate', `completed ${migration.id}: ${migration.title}`)
      continue
    }

    if (!isAgentAssisted(migration)) {
      throw new CliError(`Migration ${migration.id} has unknown kind "${migration.kind}".`)
    }
    // Agent-assisted work is batched into MIGRATION.md below; never marked completed here.
  }

  const agentPending = pending(readLock(root), version, list).filter(isAgentAssisted)
  if (agentPending.length) {
    const doc = syncPendingMigrationDoc(root, agentPending)
    for (const migration of agentPending) {
      if (!prepared.includes(migration.id)) prepared.push(migration.id)
      preparedIds.push(migration.id)
      log.step('migrate', `prepared ${migration.id}: ${migration.title}`)
    }
    setLockMigrationState(root, { migrations: completed, migrationsPrepared: prepared })
    log.detail(`Wrote ${doc}. Ask your agent to apply it, then run geeknative migrate --complete <id>.`)
  } else {
    syncPendingMigrationDoc(root, [])
  }

  if (regen && doGen) gen(root, { quiet: true })
  log.ok('migrate', `${scriptedIds.length} scripted completed, ${preparedIds.length} agent-assisted prepared`)
  return { applied: scriptedIds, prepared: preparedIds, changed }
}

/**
 * @param {NonNullable<ReturnType<typeof readLock>>} lock
 * @param {string} version
 * @param {import('../migrations/registry.js').Migration[]} list
 */
function showStatus(lock, version, list) {
  const rows = statuses(lock, version, list)
  if (!rows.length) {
    log.ok('migrate', 'no migrations for this CLI version')
    return { statuses: rows }
  }
  log.step('migrate', `${rows.length} migration(s)`)
  for (const row of rows) {
    log.detail(`${row.status.padEnd(9)} ${row.kind.padEnd(15)} ${row.id}: ${row.title}`)
  }
  const open = rows.filter((row) => row.status !== 'completed')
  if (open.some((row) => row.kind === 'agent-assisted')) {
    log.detail(`Agent instructions: ${PENDING_MIGRATION_DOC} (after migrate prepares them)`)
  }
  return { statuses: rows }
}

/**
 * @param {string} root
 * @param {NonNullable<ReturnType<typeof readLock>>} lock
 * @param {string} version
 * @param {string} id
 * @param {import('../migrations/registry.js').Migration[]} list
 * @param {{ dryRun: boolean }} options
 */
function completeMigration(root, lock, version, id, list, { dryRun }) {
  const migration = list.find((entry) => entry.id === id)
  if (!migration) {
    throw new CliError(`Unknown migration "${id}".`)
  }
  if (compareSemver(migration.since, version) > 0) {
    throw new CliError(`Migration "${id}" is for geeknative ${migration.since}; this CLI is ${version}.`)
  }
  if ((lock.migrations ?? []).includes(id)) {
    log.ok('migrate', `${id} already completed`)
    return { completed: id, already: true }
  }
  if (migration.kind === 'scripted') {
    throw new CliError(
      `Migration "${id}" is scripted. Run geeknative migrate to apply it; --complete is for agent-assisted work.`,
    )
  }
  if (!isAgentAssisted(migration)) {
    throw new CliError(`Migration "${id}" cannot be completed with --complete.`)
  }

  if (dryRun) {
    log.step('migrate', `would complete ${id}: ${migration.title}`)
    return { completed: id, dryRun: true }
  }

  const completed = [...lock.migrations, id]
  const prepared = (lock.migrationsPrepared ?? []).filter((entry) => entry !== id)
  setLockMigrationState(root, { migrations: completed, migrationsPrepared: prepared })

  const remaining = pending(readLock(root), version, list).filter(isAgentAssisted)
  const doc = syncPendingMigrationDoc(root, remaining)
  log.ok('migrate', `completed ${id}: ${migration.title}`)
  if (doc) log.detail(`Updated ${doc}`)
  else log.detail('No remaining agent-assisted migrations; removed pending MIGRATION.md')
  return { completed: id }
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
