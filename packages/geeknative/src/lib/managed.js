// @ts-check
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { walk } from './fsutil.js'
import { rel } from './project.js'

/*
 * Every file in a geeknative project has one owner:
 * - Framework: the files and AGENTS.md blocks listed here. `geeknative upgrade` replaces them.
 * - Project: everything else (docs, spec, contracts, app code). Upgrades never touch it.
 * - Generated: output of `geeknative gen`, rebuilt from contracts.
 * The lockfile records a hash of each framework-owned piece as installed, so an upgrade can
 * tell untouched files (safe to replace) from locally edited ones (merge instead). It also
 * records which project-owned migrations `geeknative migrate` has applied.
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

/**
 * Replaces the managed block in `text`, or inserts one when the markers are missing.
 * CLAUDE.md keeps its `@AGENTS.md` import above the block.
 * @param {string} text
 * @param {string} nextBlock
 */
export function replaceBlock(text, nextBlock) {
  if (BLOCK.test(text)) return text.replace(BLOCK, () => nextBlock)
  const body = text.replace(/^\uFEFF/, '')
  if (body.startsWith('@AGENTS.md')) {
    const newline = body.indexOf('\n')
    const first = newline === -1 ? body : body.slice(0, newline)
    const rest = newline === -1 ? '' : body.slice(newline + 1)
    const tail = rest.replace(/^\n*/, '\n\n')
    return `${first}\n\n${nextBlock}${tail.startsWith('\n\n') ? tail : `\n${tail}`}`
  }
  return `${nextBlock}\n${body}`
}

/** @param {string | Buffer} content */
export const hashContent = (content) => `sha256-${createHash('sha256').update(content).digest('hex')}`

/** Incoming copy written beside a conflict. It is not a framework file. @param {string} file */
const isIncomingCopy = (file) => file.endsWith('.geeknative-new')

/**
 * Hashes every framework-owned file and block in a project.
 * @param {string} root
 */
export function managedHashes(root) {
  /** @type {Record<string, string>} */
  const files = {}
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) {
      if (isIncomingCopy(file)) continue
      files[rel(root, file)] = hashContent(readFileSync(file))
    }
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
 * Bytes of every framework-owned file, and the managed block text of each AGENTS.md / CLAUDE.md.
 * @param {string} root a project or the template
 * @returns {{ files: Record<string, Buffer>, blocks: Record<string, string> }}
 */
export function managedContents(root) {
  /** @type {Record<string, Buffer>} */
  const files = {}
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) {
      if (isIncomingCopy(file)) continue
      files[rel(root, file)] = readFileSync(file)
    }
  }
  for (const file of MANAGED_FILES) {
    const full = path.join(root, file)
    if (existsSync(full)) files[file] = readFileSync(full)
  }
  /** @type {Record<string, string>} */
  const blocks = {}
  for (const file of MANAGED_BLOCK_FILES) {
    const full = path.join(root, file)
    const block = existsSync(full) ? extractBlock(readFileSync(full, 'utf8')) : null
    if (block) blocks[file] = block
  }
  return { files, blocks }
}

/**
 * @param {string} root
 * @returns {{ geeknative: string, migrations: string[], files: Record<string, string>, blocks: Record<string, string> } | null}
 */
export function readLock(root) {
  const file = path.join(root, '.geeknative', 'lock.json')
  if (!existsSync(file)) return null
  const lock = JSON.parse(readFileSync(file, 'utf8'))
  if (!Array.isArray(lock.migrations)) lock.migrations = []
  return lock
}

/**
 * Writes .geeknative/lock.json: the framework version, applied migration ids, and the hashes of
 * what it installed. `from` is the tree to hash (the project after create, or the incoming
 * template after upgrade, so local edits to managed files are not recorded as the new base).
 * Existing `migrations` are preserved unless `options.migrations` is passed.
 * @param {string} root
 * @param {string} version
 * @param {string} [from]
 * @param {{ migrations?: string[] }} [options]
 */
export function writeLock(root, version, from = root, options = {}) {
  const previous = readLock(root)
  const migrations = options.migrations ?? previous?.migrations ?? []
  const hashes = managedHashes(from)
  const lock = {
    geeknative: version,
    migrations: [...migrations],
    files: hashes.files,
    blocks: hashes.blocks,
  }
  writeFileSync(path.join(root, '.geeknative', 'lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
}

/**
 * Updates only the applied migration ids on the lockfile. Leaves version and hashes alone.
 * @param {string} root
 * @param {string[]} migrations
 */
export function setLockMigrations(root, migrations) {
  const lock = readLock(root)
  if (!lock) {
    throw new Error('No .geeknative/lock.json. This folder was not created by geeknative (or the lockfile was deleted).')
  }
  lock.migrations = [...migrations]
  writeFileSync(path.join(root, '.geeknative', 'lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
}

/** @param {Record<string, string>} object */
function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)))
}
