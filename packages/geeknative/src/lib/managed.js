// @ts-check
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { walk } from './fsutil.js'
import { CliError } from './log.js'
import { rel } from './project.js'

/*
 * Every file in a geeknative project has one owner:
 * - Framework: the files and AGENTS.md blocks listed here. `geeknative upgrade` replaces them.
 * - Project: everything else (docs, spec, contracts, app code). Upgrades never touch it.
 * - Generated: output of `geeknative gen`, rebuilt from contracts.
 * The lockfile records a hash of each framework-owned piece as installed, so an upgrade can
 * tell untouched files (safe to replace) from locally edited ones (merge instead).
 */

export const MANAGED_DIRS = [
  '.geeknative/playbooks',
  '.geeknative/templates',
  '.geeknative/hooks',
]

export const MANAGED_FILES = [
  '.geeknative/framework.mk',
  '.claude/agents/ios-engineer.md',
  '.claude/agents/android-engineer.md',
  '.claude/agents/web-engineer.md',
]

/** Files with a framework-owned block between the markers below; the rest of the file is the project's. */
export const MANAGED_BLOCK_FILES = ['AGENTS.md', 'CLAUDE.md', 'apps/ios/AGENTS.md', 'apps/android/AGENTS.md', 'apps/web/AGENTS.md']

const BLOCK = /<!-- geeknative:begin[^>]*-->[\s\S]*?<!-- geeknative:end -->/

/** @param {string} text */
export function extractBlock(text) {
  return text.match(BLOCK)?.[0] ?? null
}

/** @param {string | Buffer} content */
export const hashContent = (content) => `sha256-${createHash('sha256').update(content).digest('hex')}`

/**
 * Replaces the managed block. The rest of the file, including project rules, stays as it was.
 * Returns null when `text` has no block. Replacement is literal, so `$` in `block` is kept.
 * @param {string} text
 * @param {string} block
 */
export function replaceBlock(text, block) {
  if (!extractBlock(text)) return null
  return text.replace(BLOCK, () => block)
}

/** Framework files present in a project or a template, relative to its root. @param {string} root */
export function managedFilePaths(root) {
  /** @type {string[]} */
  const files = []
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) files.push(rel(root, file))
  }
  for (const file of MANAGED_FILES) {
    if (existsSync(path.join(root, file))) files.push(file)
  }
  return [...new Set(files)].sort()
}

/**
 * Hashes every framework-owned file and block in a project.
 * @param {string} root
 */
export function managedHashes(root) {
  /** @type {Record<string, string>} */
  const files = {}
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) files[rel(root, file)] = hashContent(readFileSync(file))
  }
  for (const file of MANAGED_FILES) {
    const full = path.join(root, file)
    if (existsSync(full)) files[file] = hashContent(readFileSync(full))
  }
  /** @type {Record<string, string>} */
  const blocks = {}
  for (const file of MANAGED_BLOCK_FILES) {
    const full = path.join(root, file)
    const block = existsSync(full) ? extractBlock(readFileSync(full, 'utf8')) : null
    if (block) blocks[file] = hashContent(block)
  }
  return { files: sortKeys(files), blocks: sortKeys(blocks) }
}

/**
 * Writes .geeknative/lock.json from the hashes of `source`.
 * `source` is the project at create time. On upgrade it is the new template, so a merged
 * local edit stays different from the lock and the next upgrade merges it again.
 * @param {string} root project that receives the lockfile
 * @param {string} version
 * @param {string} source tree whose framework files are hashed
 */
export function writeLockFrom(root, version, source) {
  const lock = { geeknative: version, ...managedHashes(source) }
  writeFileSync(path.join(root, '.geeknative', 'lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
}

/**
 * Writes .geeknative/lock.json: the framework version and the hashes of what it installed.
 * @param {string} root
 * @param {string} version
 */
export function writeLock(root, version) {
  writeLockFrom(root, version, root)
}

/**
 * @param {string} root
 * @returns {{ geeknative: string, files: Record<string, string>, blocks: Record<string, string> }}
 */
export function readLock(root) {
  const file = path.join(root, '.geeknative', 'lock.json')
  if (!existsSync(file)) {
    throw new CliError(
      'This project has no .geeknative/lock.json, so it cannot be upgraded. It was created before geeknative recorded framework file hashes.',
    )
  }
  let lock
  try {
    lock = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new CliError(`.geeknative/lock.json is not valid JSON: ${/** @type {Error} */ (error).message}`)
  }
  if (typeof lock?.geeknative !== 'string' || !isRecord(lock.files) || !isRecord(lock.blocks)) {
    throw new CliError('.geeknative/lock.json is not a geeknative lockfile.')
  }
  return lock
}

/** @param {unknown} value */
function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** @param {Record<string, string>} object */
function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)))
}
