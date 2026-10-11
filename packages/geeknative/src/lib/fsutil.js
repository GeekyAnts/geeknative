// @ts-check
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { CliError } from './log.js'

/** Build output and local state that never belongs in a template copy. */
const ARTIFACTS = new Set([
  'node_modules',
  '.build',
  'build',
  '.gradle',
  '.kotlin',
  '.idea',
  'DerivedData',
  'xcuserdata',
  '.output',
  '.tanstack',
  '.nitro',
  '.vinxi',
  'dist',
  '.DS_Store',
  'local.properties',
  'package-lock.json',
])

/**
 * Reads and parses a JSON file, with an error message an agent can act on.
 * @param {string} file
 * @param {string} label shown in errors, e.g. "contracts/app.json"
 */
export function readJson(file, label) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    throw new CliError(`${label} is missing.`)
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new CliError(`${label} is not valid JSON: ${/** @type {Error} */ (error).message}`)
  }
}

/**
 * Writes `content` only if it differs from what's on disk. Returns true when the file changed.
 * @param {string} file
 * @param {string | Buffer} content
 */
export function writeIfChanged(file, content) {
  const next = typeof content === 'string' ? Buffer.from(content) : content
  if (existsSync(file) && readFileSync(file).equals(next)) return false
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, next)
  return true
}

/**
 * Lists files under `dir` recursively, skipping build artifacts and dependencies.
 * @param {string} dir
 * @returns {string[]} absolute paths
 */
export function walk(dir) {
  if (!existsSync(dir)) return []
  /** @type {string[]} */
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ARTIFACTS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

/**
 * Copies the template into a new project. Files named `_gitignore` become `.gitignore`
 * (npm drops real .gitignore files from published packages).
 * @param {string} from
 * @param {string} to
 * @param {{ keepGitignoreNames?: boolean }} [options]
 */
export function copyTemplate(from, to, { keepGitignoreNames = false } = {}) {
  for (const file of walk(from)) {
    const relative = path.relative(from, file)
    if (relative.startsWith(`.geeknative${path.sep}logs${path.sep}`)) continue
    const renamed = keepGitignoreNames ? relative : relative.replace(/(^|[\\/])_gitignore$/, '$1.gitignore')
    const target = path.join(to, renamed)
    mkdirSync(path.dirname(target), { recursive: true })
    copyFileSync(file, target)
  }
}
