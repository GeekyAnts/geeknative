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
const hash = (content) => `sha256-${createHash('sha256').update(content).digest('hex')}`

/**
 * Hashes every framework-owned file and block in a project.
 * @param {string} root
 */
export function managedHashes(root) {
  /** @type {Record<string, string>} */
  const files = {}
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) files[rel(root, file)] = hash(readFileSync(file))
  }
  for (const file of MANAGED_FILES) {
    const full = path.join(root, file)
    if (existsSync(full)) files[file] = hash(readFileSync(full))
  }
  /** @type {Record<string, string>} */
  const blocks = {}
  for (const file of MANAGED_BLOCK_FILES) {
    const full = path.join(root, file)
    const block = existsSync(full) ? extractBlock(readFileSync(full, 'utf8')) : null
    if (block) blocks[file] = hash(block)
  }
  return { files: sortKeys(files), blocks: sortKeys(blocks) }
}

/**
 * Writes .geeknative/lock.json: the framework version and the hashes of what it installed.
 * @param {string} root
 * @param {string} version
 */
export function writeLock(root, version) {
  const lock = { geeknative: version, ...managedHashes(root) }
  writeFileSync(path.join(root, '.geeknative', 'lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
}

/** @param {Record<string, string>} object */
function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)))
}
