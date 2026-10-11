// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CliError } from './log.js'

/** Root of the geeknative npm package. */
export const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** The repo's template/ folder, which exists only when running from a git checkout. */
const REPO_TEMPLATE_DIR = path.resolve(PACKAGE_DIR, '../../template')

/** True when this CLI runs from a checkout of the geeknative repo rather than from npm. */
export function isLocalCheckout() {
  return !existsSync(path.join(PACKAGE_DIR, 'template')) && existsSync(REPO_TEMPLATE_DIR)
}

/** The project template: bundled in the npm package, or the repo's template/ in a checkout. */
export function templateDir() {
  const bundled = path.join(PACKAGE_DIR, 'template')
  if (existsSync(bundled)) return bundled
  if (existsSync(REPO_TEMPLATE_DIR)) return REPO_TEMPLATE_DIR
  throw new CliError('Could not find the geeknative template.')
}

export function packageVersion() {
  return JSON.parse(readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8')).version
}

/** Walks up from `start` to the project root: the folder that contains contracts/app.json. */
export function findProjectRoot(start = process.cwd()) {
  let dir = path.resolve(start)
  for (;;) {
    if (existsSync(path.join(dir, 'contracts', 'app.json'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw new CliError(
        'Not inside a geeknative project (no contracts/app.json found). Run this from your project folder.',
      )
    }
    dir = parent
  }
}

/**
 * Path relative to the project root, with forward slashes.
 * @param {string} root
 * @param {string} file
 */
export function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/')
}
