// @ts-check
/**
 * Project-owned migrations. `geeknative upgrade` never runs these; `geeknative migrate` does.
 * Production list stays empty until a release ships a real format change. Tests pass a fixture list.
 *
 * @typedef {{
 *   id: string,
 *   since: string,
 *   kind: 'scripted' | 'written',
 *   title: string,
 *   run?: (root: string, options: { dryRun: boolean }) => { changed: string[], regen?: boolean },
 *   guide?: string,
 * }} Migration
 */

/** @type {Migration[]} */
export const MIGRATIONS = []

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

/**
 * Migrations introduced at or before `cliVersion` that are not yet recorded on the lock.
 * @param {{ migrations?: string[] } | null | undefined} lock
 * @param {string} cliVersion
 * @param {Migration[]} [list]
 */
export function pending(lock, cliVersion, list = MIGRATIONS) {
  const applied = new Set(lock?.migrations ?? [])
  return list.filter(
    (migration) => !applied.has(migration.id) && compareSemver(migration.since, cliVersion) <= 0,
  )
}
