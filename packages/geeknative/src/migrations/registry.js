// @ts-check
import { seedContractsConfig } from './contracts-config.js'
import { rewriteStarterIcons } from './lucide-starter-icons.js'
import { alignSystemFontTypeSizes } from './system-font-type-sizes.js'

/**
 * Project-owned migrations. `geeknative upgrade` never runs these; `geeknative migrate` does.
 * Tests pass a fixture list; production uses `MIGRATIONS`.
 *
 * @typedef {'pending' | 'prepared' | 'completed'} MigrationStatus
 * @typedef {{
 *   id: string,
 *   since: string,
 *   kind: 'scripted' | 'agent-assisted',
 *   title: string,
 *   run?: (root: string, options: { dryRun: boolean }) => { changed: string[], regen?: boolean },
 *   objective?: string,
 *   platforms?: string[],
 *   changes?: string[],
 *   validation?: string[],
 *   guide?: string,
 * }} Migration
 */

/** @type {Migration[]} */
export const MIGRATIONS = [
  {
    id: 'contracts-config',
    since: '0.1.1',
    kind: 'scripted',
    title: 'Add contracts/config.json when the project does not have one',
    run: (root) => seedContractsConfig(root),
  },
  {
    id: 'system-font-type-sizes',
    since: '0.1.1',
    kind: 'scripted',
    title: 'Match system-font type sizes to their Dynamic Type styles',
    run: (root) => alignSystemFontTypeSizes(root),
  },
  {
    id: 'lucide-starter-icons',
    since: '0.1.1',
    kind: 'scripted',
    title: 'Rewrite the starter back, home, and settings icons as Lucide names',
    run: (root) => rewriteStarterIcons(root),
  },
]

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} negative when a < b, 0 when equal, positive when a > b
 */
export function compareSemver(a, b) {
  const parse = (/** @type {string} */ v) =>
    String(v)
      .replace(/^v/, '')
      .split(/[.+-]/)
      .map((part) => {
        const n = Number(part)
        return Number.isFinite(n) ? n : 0
      })
  const left = parse(a)
  const right = parse(b)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff) return diff
  }
  return 0
}

/** Ids of every migration known to this CLI, in registry order. */
export function knownMigrationIds(list = MIGRATIONS) {
  return list.map((migration) => migration.id)
}

/** @param {Migration} migration */
export function isAgentAssisted(migration) {
  return migration.kind === 'agent-assisted'
}

/**
 * Migrations introduced at or before `cliVersion` that are not yet completed.
 * Prepared agent-assisted migrations stay here until `migrate --complete <id>`.
 * @param {{ migrations?: string[] } | null | undefined} lock
 * @param {string} cliVersion
 * @param {Migration[]} [list]
 */
export function pending(lock, cliVersion, list = MIGRATIONS) {
  const completed = new Set(lock?.migrations ?? [])
  return list.filter(
    (migration) => !completed.has(migration.id) && compareSemver(migration.since, cliVersion) <= 0,
  )
}

/**
 * @param {{ migrations?: string[], migrationsPrepared?: string[] } | null | undefined} lock
 * @param {Migration} migration
 * @returns {MigrationStatus}
 */
export function migrationStatus(lock, migration) {
  const completed = new Set(lock?.migrations ?? [])
  if (completed.has(migration.id)) return 'completed'
  const prepared = new Set(lock?.migrationsPrepared ?? [])
  if (prepared.has(migration.id)) return 'prepared'
  return 'pending'
}

/**
 * Migrations at or before `cliVersion`, with their lock status.
 * @param {{ migrations?: string[], migrationsPrepared?: string[] } | null | undefined} lock
 * @param {string} cliVersion
 * @param {Migration[]} [list]
 */
export function statuses(lock, cliVersion, list = MIGRATIONS) {
  return list
    .filter((migration) => compareSemver(migration.since, cliVersion) <= 0)
    .map((migration) => ({
      id: migration.id,
      title: migration.title,
      kind: migration.kind,
      status: migrationStatus(lock, migration),
    }))
}
