// @ts-check
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { capture } from './exec.js'
import { copyTemplate } from './fsutil.js'
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

/**
 * Packs this checkout's CLI and template into `destDir` as an npm tarball, named after the
 * version and the commit it was packed from (with "-dirty" for uncommitted changes), so a
 * project can depend on a fixed snapshot instead of whatever branch the checkout has open.
 * Packs from a staging copy: `npm pack` in the package itself would bundle template/ into it for
 * a moment, and any geeknative running from this checkout meanwhile would stop seeing a checkout.
 * @param {string} destDir
 * @returns {{ file: string, commit: string | null, branch: string | null, dirty: boolean }}
 */
export function packCheckout(destDir) {
  const repo = path.dirname(REPO_TEMPLATE_DIR)
  const stage = mkdtempSync(path.join(os.tmpdir(), 'geeknative-pack-'))
  try {
    for (const part of ['bin', 'src', 'package.json', 'LICENSE']) {
      if (existsSync(path.join(PACKAGE_DIR, part))) cpSync(path.join(PACKAGE_DIR, part), path.join(stage, part), { recursive: true })
    }
    copyTemplate(REPO_TEMPLATE_DIR, path.join(stage, 'template'), { keepGitignoreNames: true })
    const packed = capture('npm', ['pack', '--ignore-scripts', '--silent', '--pack-destination', destDir], { cwd: stage })
    const tarball = packed?.split('\n').pop()
    if (!tarball) throw new CliError('Could not pack the local geeknative checkout with `npm pack`.')

    const commit = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo })
    const branch = capture('git', ['branch', '--show-current'], { cwd: repo }) || null
    const dirty = Boolean(capture('git', ['status', '--porcelain'], { cwd: repo }))
    const file = `geeknative-${packageVersion()}${commit ? `-${commit}${dirty ? '-dirty' : ''}` : ''}.tgz`
    renameSync(path.join(destDir, tarball), path.join(destDir, file))
    return { file, commit, branch, dirty }
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
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
