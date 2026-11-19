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
 * Bytes of every framework-owned file, and the managed block text of each AGENTS.md / CLAUDE.md.
 * @param {string} root a project or the template
 * @returns {{ files: Record<string, Buffer>, blocks: Record<string, string> }}
 */
export function managedContents(root) {
  /** @type {Record<string, Buffer>} */
  const files = {}
  for (const dir of MANAGED_DIRS) {
    for (const file of walk(path.join(root, dir))) files[rel(root, file)] = readFileSync(file)
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
 * @returns {{ geeknative: string, files: Record<string, string>, blocks: Record<string, string> } | null}
 */
export function readLock(root) {
  const file = path.join(root, '.geeknative', 'lock.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
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
