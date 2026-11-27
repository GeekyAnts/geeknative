// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Project-owned migrations. `geeknative upgrade` never runs these; `geeknative migrate` does.
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
    id: 'favicon-ico',
    since: '0.1.1',
    kind: 'scripted',
    title: 'Point the web shell at the generated favicon.ico',
    run: pointWebShellAtFavicon,
  },
]

const OLD_FAVICON_LINK = `{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }`
const NEW_FAVICON_LINK = `{ rel: 'icon', href: '/favicon.ico' }`

/**
 * Rewrites the template's old favicon link. Leaves a shell that already points at favicon.ico,
 * or any other icon link, alone.
 * @param {string} root
 * @param {{ dryRun: boolean }} options
 * @returns {{ changed: string[] }}
 */
function pointWebShellAtFavicon(root, { dryRun }) {
  const relative = 'apps/web/src/routes/__root.tsx'
  const file = path.join(root, relative)
  if (!existsSync(file)) return { changed: [] }
  const text = readFileSync(file, 'utf8')
  if (!text.includes(OLD_FAVICON_LINK)) return { changed: [] }
  if (!dryRun) writeFileSync(file, text.replace(OLD_FAVICON_LINK, NEW_FAVICON_LINK))
  return { changed: [relative] }
}

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
