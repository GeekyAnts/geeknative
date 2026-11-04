// @ts-check
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { geeknativeSource } from './doctor.js'
import { gen } from './gen.js'
import { capture, runInherit } from '../lib/exec.js'
import { writeIfChanged } from '../lib/fsutil.js'
import { CliError, log } from '../lib/log.js'
import {
  extractBlock,
  hashContent,
  MANAGED_BLOCK_FILES,
  managedFilePaths,
  managedHashes,
  readLock,
  replaceBlock,
  writeLockFrom,
} from '../lib/managed.js'
import { isLocalCheckout, PACKAGE_DIR, packCheckout, packageVersion, templateDir } from '../lib/project.js'

/**
 * @typedef {'replace' | 'merge' | 'add' | 'delete' | 'conflict' | 'no-base' | 'kept' | 'missing' | 'unchanged'} ActionKind
 * @typedef {{ kind: ActionKind, path: string, content?: string | Buffer, note?: string }} Action
 * @typedef {{ action: 'range' | 'snapshot' | 'link' | 'refuse', spec?: string, message?: string }} DependencyPlan
 */

const CHANGES = new Set(['replace', 'merge', 'add', 'delete'])
const BLOCKING = new Set(['conflict', 'no-base'])

/**
 * How `upgrade` should repoint devDependencies.geeknative.
 * A registry CLI refuses a snapshot or link unless `--npm` is set, so a pin is never
 * swapped for a published package by accident. A checkout CLI keeps a link and refreshes
 * anything else to a snapshot of that checkout.
 * @param {'linked' | 'snapshot' | 'registry' | 'missing'} kind
 * @param {{ fromCheckout: boolean, version: string, forceNpm?: boolean }} options
 * @returns {DependencyPlan}
 */
export function planDependency(kind, { fromCheckout, version, forceNpm = false }) {
  if (!fromCheckout && (kind === 'snapshot' || kind === 'linked') && !forceNpm) {
    return {
      action: 'refuse',
      message:
        'This project is pinned to a geeknative checkout. Run upgrade from that checkout, or pass --npm to switch to the published package.',
    }
  }
  if (forceNpm || !fromCheckout) return { action: 'range', spec: `^${version}` }
  if (kind === 'linked') return { action: 'link', spec: `file:${PACKAGE_DIR}` }
  return { action: 'snapshot' }
}

/**
 * Brings a project's framework files up to the geeknative that is running.
 * The lock records the template that shipped, not merged local edits, so the next
 * upgrade can still tell an untouched file from one you changed.
 * @param {string} root
 * @param {{
 *   dryRun?: boolean,
 *   install?: boolean,
 *   npm?: boolean,
 *   baseDir?: string | null,
 *   nextDir?: string,
 *   version?: string,
 *   gen?: boolean,
 *   updateDependency?: boolean,
 *   fromCheckout?: boolean,
 * }} [options]
 *   `baseDir` null skips the search for the previously installed template.
 *   `fromCheckout` overrides detection, so tests can cover both install styles.
 * @returns {Promise<{ ok: boolean }>}
 */
export async function upgrade(root, options = {}) {
  const {
    dryRun = false,
    install = true,
    npm = false,
    nextDir = templateDir(),
    version = packageVersion(),
    gen: regenerate = true,
    updateDependency = true,
    fromCheckout = isLocalCheckout(),
  } = options

  const lock = readLock(root)
  const dependency = updateDependency ? planProjectDependency(root, { fromCheckout, version, forceNpm: npm }) : null
  if (dependency?.action === 'refuse' && !dryRun) throw new CliError(dependency.message ?? 'Cannot upgrade this dependency.')

  const resolved = options.baseDir === undefined ? resolveBase(root, lock) : { dir: options.baseDir, cleanups: /** @type {string[]} */ ([]) }
  let actions
  try {
    actions = planFiles(root, resolved.dir, nextDir, lock)
  } finally {
    for (const dir of resolved.cleanups) rmSync(dir, { recursive: true, force: true })
  }

  const changes = actions.filter((action) => CHANGES.has(action.kind))
  const blocking = actions.filter((action) => BLOCKING.has(action.kind))
  const notices = actions.filter((action) => action.kind === 'kept' || action.kind === 'missing')
  const dependencySame = !dependency || (dependency.action !== 'snapshot' && dependency.spec === currentSpec(root))

  if (lock.geeknative === version && changes.length === 0 && blocking.length === 0 && dependencySame && notices.length === 0) {
    log.ok('upgrade', `already on ${version}`)
    return { ok: true }
  }

  log.step('upgrade', `${lock.geeknative} → ${version}`)
  for (const action of notices) log.warn('upgrade', `${action.path} ${action.note}`)
  if (dependency?.action === 'refuse') log.fail('upgrade', dependency.message ?? 'Cannot upgrade this dependency.')
  if (dryRun) {
    for (const action of [...changes, ...blocking]) describe(action, true)
    log.warn('upgrade', 'dry run, nothing written')
    return { ok: blocking.length === 0 && dependency?.action !== 'refuse' }
  }

  rmSync(path.join(root, '.geeknative', 'upgrade'), { recursive: true, force: true })
  for (const action of changes) applyChange(root, action)
  for (const action of blocking) writeConflict(root, action)
  if (blocking.length) {
    log.fail('upgrade', `${blocking.length} ${blocking.length === 1 ? 'file needs' : 'files need'} attention. The lockfile was left unchanged.`)
    return { ok: false }
  }

  const specBefore = currentSpec(root)
  if (dependency && dependency.action !== 'refuse') applyDependency(root, dependency)
  if (install && currentSpec(root) !== specBefore) await installDependencies(root)
  if (regenerate) gen(root)
  writeLockFrom(root, version, nextDir)
  log.ok('upgrade', `now on ${version}. Run \`make check\`.`)
  return { ok: true }
}

/**
 * @param {string} root
 * @param {{ fromCheckout: boolean, version: string, forceNpm: boolean }} options
 * @returns {DependencyPlan}
 */
function planProjectDependency(root, options) {
  const spec = currentSpec(root)
  const kind = spec === undefined ? 'missing' : geeknativeSource(spec, root).kind
  return planDependency(kind, options)
}

/** @param {string} root */
function currentSpec(root) {
  const file = path.join(root, 'package.json')
  if (!existsSync(file)) return undefined
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  return /** @type {string | undefined} */ (pkg.devDependencies?.geeknative)
}

/**
 * @param {string} root
 * @param {DependencyPlan} plan
 */
function applyDependency(root, plan) {
  const file = path.join(root, 'package.json')
  if (!existsSync(file)) throw new CliError('package.json is missing, so the geeknative dependency cannot be updated.')
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const previous = /** @type {string | undefined} */ (pkg.devDependencies?.geeknative)
  const source = geeknativeSource(previous, root)

  if (plan.action === 'snapshot') {
    const snapshot = packCheckout(path.join(root, '.geeknative'))
    plan.spec = `file:.geeknative/${snapshot.file}`
    if (previous === plan.spec) {
      log.ok('upgrade', `already pinned to ${snapshot.file}`)
      return
    }
  }

  if (!plan.spec || previous === plan.spec) return
  pkg.devDependencies = { ...pkg.devDependencies, geeknative: plan.spec }
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  if (plan.action === 'range' && source.kind === 'snapshot' && source.target && existsSync(source.target)) rmSync(source.target)
  if (plan.action === 'snapshot') {
    const old = previous?.match(/^file:(\.geeknative\/geeknative-[^/]+\.tgz)$/)?.[1]
    if (old && existsSync(path.join(root, old))) rmSync(path.join(root, old))
    log.ok('upgrade', `pinned to ${plan.spec.replace('file:.geeknative/', '')}`)
    return
  }
  log.ok('upgrade', plan.action === 'link' ? `linked to ${PACKAGE_DIR}` : `dependency set to ${plan.spec}`)
}

/** @param {string} root */
async function installDependencies(root) {
  log.step('install', 'npm install…')
  if ((await runInherit('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root })) !== 0) {
    throw new CliError('npm install failed after upgrading; run it again.')
  }
  log.ok('install', 'dependencies installed')
}

/**
 * The template whose hashes match the lock. Untouched files can be replaced without it;
 * a three-way merge of an edited file cannot.
 * @param {string} root
 * @param {{ geeknative: string, files: Record<string, string>, blocks: Record<string, string> }} lock
 * @returns {{ dir: string | null, cleanups: string[] }}
 */
function resolveBase(root, lock) {
  /** @type {string[]} */
  const cleanups = []
  /** @type {string[]} */
  const candidates = []
  const installed = path.join(root, 'node_modules', 'geeknative')
  if (existsSync(installed)) pushTemplate(candidates, installed)

  const spec = currentSpec(root)
  const source = spec ? geeknativeSource(spec, root) : null
  if (source?.kind === 'linked' && source.target) pushTemplate(candidates, source.target)
  if (source?.kind === 'snapshot' && source.target && existsSync(source.target)) {
    const extracted = extractTemplate(source.target)
    if (extracted) {
      cleanups.push(extracted.cleanup)
      candidates.push(extracted.template)
    }
  }
  for (const dir of candidates) {
    if (templateMatchesLock(dir, lock)) return { dir, cleanups }
  }

  if (!source || source.kind === 'registry') {
    const packed = packRegistryTemplate(lock.geeknative)
    if (packed) {
      cleanups.push(packed.cleanup)
      if (templateMatchesLock(packed.template, lock)) return { dir: packed.template, cleanups }
    }
  }
  return { dir: null, cleanups }
}

/**
 * @param {string[]} candidates
 * @param {string} packageDir
 */
function pushTemplate(candidates, packageDir) {
  const bundled = path.join(packageDir, 'template')
  if (existsSync(bundled)) candidates.push(bundled)
  const repo = path.resolve(packageDir, '../../template')
  if (existsSync(path.join(repo, 'contracts', 'app.json'))) candidates.push(repo)
}

/**
 * @param {string} dir
 * @param {{ files: Record<string, string>, blocks: Record<string, string> }} lock
 */
function templateMatchesLock(dir, lock) {
  const hashes = managedHashes(dir)
  return Object.entries(lock.files).every(([file, hash]) => hashes.files[file] === hash)
    && Object.entries(lock.blocks).every(([file, hash]) => hashes.blocks[file] === hash)
}

/**
 * @param {string} tarball
 * @returns {{ template: string, cleanup: string } | null}
 */
function extractTemplate(tarball) {
  const cleanup = mkdtempSync(path.join(os.tmpdir(), 'geeknative-upgrade-'))
  if (capture('tar', ['-xzf', tarball, '-C', cleanup, 'package/template']) === null) {
    rmSync(cleanup, { recursive: true, force: true })
    return null
  }
  const template = path.join(cleanup, 'package', 'template')
  if (!existsSync(template)) {
    rmSync(cleanup, { recursive: true, force: true })
    return null
  }
  return { template, cleanup }
}

/**
 * @param {string} version
 * @returns {{ template: string, cleanup: string } | null}
 */
function packRegistryTemplate(version) {
  const dest = mkdtempSync(path.join(os.tmpdir(), 'geeknative-upgrade-'))
  const packed = capture('npm', ['pack', `geeknative@${version}`, '--ignore-scripts', '--silent', '--pack-destination', dest])
  const tarball = packed?.split('\n').pop()
  if (!tarball) {
    rmSync(dest, { recursive: true, force: true })
    return null
  }
  const extracted = extractTemplate(path.join(dest, tarball))
  rmSync(dest, { recursive: true, force: true })
  return extracted
}

/**
 * @param {string} project
 * @param {string | null} base
 * @param {string} next
 * @param {{ files: Record<string, string>, blocks: Record<string, string> }} lock
 * @returns {Action[]}
 */
function planFiles(project, base, next, lock) {
  /** @type {Action[]} */
  const actions = []
  const nextFiles = new Set(managedFilePaths(next))
  const paths = [...new Set([...Object.keys(lock.files), ...nextFiles])].sort()
  for (const relPath of paths) actions.push(planFile(project, base, next, lock.files[relPath], relPath, nextFiles.has(relPath)))
  for (const relPath of MANAGED_BLOCK_FILES) actions.push(...planBlock(project, base, next, lock.blocks[relPath], relPath))
  return actions
}

/**
 * @param {string} project
 * @param {string | null} base
 * @param {string} next
 * @param {string | undefined} lockHash
 * @param {string} relPath
 * @param {boolean} inNext
 * @returns {Action}
 */
function planFile(project, base, next, lockHash, relPath, inNext) {
  const current = readIfExists(path.join(project, relPath))
  const nextContent = inNext ? readIfExists(path.join(next, relPath)) : null
  if (inNext && !lockHash) {
    if (!current) return { kind: 'add', path: relPath, content: nextContent ?? '' }
    if (same(current, nextContent)) return { kind: 'unchanged', path: relPath }
    return { kind: 'conflict', path: relPath, content: nextContent ?? '', note: 'this path was not installed by geeknative' }
  }
  if (!inNext) {
    if (!current) return { kind: 'missing', path: relPath, note: 'deleted locally; left missing' }
    if (lockHash && sameHash(current, lockHash)) return { kind: 'delete', path: relPath }
    return { kind: 'kept', path: relPath, note: 'edited locally; kept, this version no longer ships it' }
  }
  if (!current) return { kind: 'missing', path: relPath, note: 'deleted locally; left missing' }
  if (same(current, nextContent)) return { kind: 'unchanged', path: relPath }
  if (lockHash && sameHash(current, lockHash)) return { kind: 'replace', path: relPath, content: nextContent ?? '' }
  const baseContent = base ? readIfExists(path.join(base, relPath)) : null
  if (!baseContent || !lockHash || !sameHash(baseContent, lockHash)) return { kind: 'no-base', path: relPath, content: nextContent ?? '' }
  const merged = mergeText(current.toString('utf8'), baseContent.toString('utf8'), (nextContent ?? Buffer.from('')).toString('utf8'))
  return merged.clean
    ? { kind: 'merge', path: relPath, content: merged.text }
    : { kind: 'conflict', path: relPath, content: merged.text }
}

/**
 * @param {string} project
 * @param {string | null} base
 * @param {string} next
 * @param {string | undefined} lockHash
 * @param {string} relPath
 * @returns {Action[]}
 */
function planBlock(project, base, next, lockHash, relPath) {
  const projectText = textIfExists(path.join(project, relPath))
  const nextText = textIfExists(path.join(next, relPath))
  const baseText = base ? textIfExists(path.join(base, relPath)) : null
  const ours = projectText == null ? null : extractBlock(projectText)
  const nextBlock = nextText == null ? null : extractBlock(nextText)
  const baseBlock = baseText == null ? null : extractBlock(baseText)
  if (!lockHash && !nextBlock) return []
  if (projectText == null) {
    if (!lockHash && nextText) return [{ kind: 'add', path: relPath, content: nextText }]
    return [{ kind: 'missing', path: relPath, note: 'deleted locally; left missing' }]
  }
  if (!ours) {
    if (!lockHash) return [{ kind: 'kept', path: relPath, note: 'has no managed block; left as is' }]
    return [{ kind: 'missing', path: relPath, note: 'managed block removed locally; left as is' }]
  }
  if (!nextBlock) {
    if (lockHash && hashContent(ours) === lockHash) {
      return [{ kind: 'replace', path: relPath, content: replaceBlock(projectText, '') ?? projectText }]
    }
    return [{ kind: 'kept', path: relPath, note: 'edited locally; kept, this version no longer ships the block' }]
  }
  if (hashContent(ours) === hashContent(nextBlock)) return []
  if (lockHash && hashContent(ours) === lockHash) {
    return [{ kind: 'replace', path: relPath, content: replaceBlock(projectText, nextBlock) ?? projectText }]
  }
  if (!baseBlock || !lockHash || hashContent(baseBlock) !== lockHash) {
    return [{ kind: 'no-base', path: relPath, content: replaceBlock(projectText, nextBlock) ?? projectText }]
  }
  const merged = mergeText(ours, baseBlock, nextBlock)
  const full = replaceBlock(projectText, merged.text) ?? projectText
  return [merged.clean ? { kind: 'merge', path: relPath, content: full } : { kind: 'conflict', path: relPath, content: full }]
}

/**
 * @param {string} ours
 * @param {string} base
 * @param {string} theirs
 * @returns {{ clean: boolean, text: string }}
 */
function mergeText(ours, base, theirs) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'geeknative-merge-'))
  const oursFile = path.join(dir, 'ours')
  const baseFile = path.join(dir, 'base')
  const theirsFile = path.join(dir, 'theirs')
  writeFileSync(oursFile, ours)
  writeFileSync(baseFile, base)
  writeFileSync(theirsFile, theirs)
  try {
    // A conflict is a non-zero status with the merged text on stdout. `capture` would drop that.
    const result = spawnSync(
      'git',
      ['merge-file', '-p', '--diff3', '-L', 'yours', '-L', 'installed', '-L', 'upgrade', oursFile, baseFile, theirsFile],
      { encoding: 'utf8' },
    )
    if (result.error || result.status == null || result.status < 0) {
      throw new CliError('git merge-file failed. Upgrade needs git to merge framework files you edited.')
    }
    return { clean: result.status === 0, text: result.stdout }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * @param {string} root
 * @param {Action} action
 */
function applyChange(root, action) {
  const file = path.join(root, action.path)
  if (action.kind === 'delete') {
    rmSync(file, { force: true })
    log.ok('upgrade', `${action.path} removed`)
    return
  }
  writeIfChanged(file, action.content ?? '')
  const verb = action.kind === 'add' ? 'added' : action.kind === 'merge' ? 'merged' : 'replaced'
  log.ok('upgrade', `${action.path} ${verb}`)
}

/**
 * @param {string} root
 * @param {Action} action
 */
function writeConflict(root, action) {
  const dest = path.join(root, '.geeknative', 'upgrade', action.path)
  mkdirSync(path.dirname(dest), { recursive: true })
  writeFileSync(dest, action.content ?? '')
  describe(action, false)
}

/**
 * @param {Action} action
 * @param {boolean} dryRun
 */
function describe(action, dryRun) {
  if (CHANGES.has(action.kind)) {
    const verb = action.kind === 'delete' ? 'remove' : action.kind
    log.ok('upgrade', dryRun ? `${action.path} would ${verb}` : `${action.path} ${verb}`)
    return
  }
  const why = action.kind === 'conflict'
    ? 'has conflicts'
    : 'was edited, and the installed copy of that version is gone'
  log.fail('upgrade', `${action.path} ${why}`)
  log.detail(`.geeknative/upgrade/${action.path}`)
}

/** @param {Buffer | null} content @param {Buffer | null} other */
function same(content, other) {
  return Boolean(content && other && content.equals(other))
}

/** @param {Buffer} content @param {string} hash */
function sameHash(content, hash) {
  return hashContent(content) === hash
}

/** @param {string} file */
function readIfExists(file) {
  return existsSync(file) ? readFileSync(file) : null
}

/** @param {string} file */
function textIfExists(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}
