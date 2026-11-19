// @ts-check
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { capture, runInherit } from '../lib/exec.js'
import { CliError, log } from '../lib/log.js'
import { hashContent, managedContents, readLock, replaceBlock, writeLock } from '../lib/managed.js'
import { isLocalCheckout, packageVersion, templateDir } from '../lib/project.js'
import { geeknativeSource } from './doctor.js'
import { gen } from './gen.js'
import { pin } from './pin.js'

/**
 * @typedef {'skip' | 'add' | 'replace' | 'remove' | 'keep' | 'merge'} Action
 * @typedef {{ kind: 'file' | 'block', path: string, action: Action, current: Buffer | string | null, incoming: Buffer | string | null }} Step
 */

/**
 * Updates framework-owned files to the running CLI's template, using `.geeknative/lock.json`
 * to replace untouched files and three-way merge locally edited ones.
 *
 * @param {string} root
 * @param {{
 *   incoming?: string,
 *   previous?: string,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   install?: boolean,
 *   pin?: boolean,
 *   gen?: boolean,
 * }} [options]
 *   `incoming` / `previous` are template roots (tests pass fixtures). `pin` and `gen` default on.
 */
export async function upgrade(
  root,
  { incoming = templateDir(), previous, dryRun = false, force = false, install = true, pin: doPin = true, gen: doGen = true } = {},
) {
  const lock = readLock(root)
  if (!lock) {
    throw new CliError(
      'No .geeknative/lock.json. This folder was not created by geeknative (or the lockfile was deleted).',
    )
  }

  const version = packageVersion()
  const next = managedContents(incoming)
  const current = managedContents(root)
  const steps = [
    ...planKind('file', lock.files ?? {}, current.files, next.files),
    ...planKind('block', lock.blocks ?? {}, current.blocks, next.blocks),
  ]
  const work = steps.filter((step) => step.action !== 'skip')

  if (!work.length) {
    if (!dryRun && lock.geeknative !== version) {
      writeLock(root, version, incoming)
      await bumpDependency(root, { install, pin: doPin })
    }
    log.ok('upgrade', `already at ${version}`)
    return { changed: [], conflicts: [] }
  }

  log.step('upgrade', `${lock.geeknative ?? 'unknown'} → ${version}`)

  let previousRoot = previous ?? null
  /** @type {string | null} */
  let cleanup = null
  const needsMerge = !force && work.some((step) => step.action === 'merge')
  if (needsMerge && !previousRoot) {
    const found = findPreviousTemplate(root, lock.geeknative)
    previousRoot = found.template
    cleanup = found.cleanup
    if (!previousRoot && lock.geeknative) {
      log.step('upgrade', `fetching geeknative@${lock.geeknative} for a three-way merge…`)
      const packed = packFromRegistry(lock.geeknative)
      if (packed) {
        previousRoot = packed.template
        cleanup = packed.cleanup
      }
    }
  }

  try {
    const base = previousRoot ? managedContents(previousRoot) : { files: {}, blocks: {} }
    /** @type {string[]} */
    const changed = []
    /** @type {string[]} */
    const conflicts = []

    for (const step of work) {
      const label = step.kind === 'block' ? `${step.path} (block)` : step.path
      if (step.action === 'keep') {
        log.warn('upgrade', `kept local ${label}`)
        continue
      }

      if (step.action === 'merge') {
        const ancestor = step.kind === 'block' ? base.blocks[step.path] : base.files[step.path]
        if (force) {
          applyStep(root, step, step.incoming, dryRun)
          log.ok('upgrade', dryRun ? `would replace ${label}` : `replaced ${label}`)
          changed.push(step.path)
          continue
        }
        if (ancestor == null) {
          if (!dryRun) writeIncomingSibling(root, step)
          log.fail('upgrade', `conflict in ${label} (no previous template to merge against)`)
          conflicts.push(step.path)
          continue
        }
        const merged = merge3(step.current, ancestor, step.incoming)
        if (merged.conflict) {
          if (!dryRun) writeIncomingSibling(root, step)
          log.fail('upgrade', `conflict in ${label}`)
          conflicts.push(step.path)
          continue
        }
        applyStep(root, step, step.kind === 'file' ? Buffer.from(merged.text) : merged.text, dryRun)
        log.ok('upgrade', dryRun ? `would merge ${label}` : `merged ${label}`)
        changed.push(step.path)
        continue
      }

      if (step.action === 'remove') {
        if (!dryRun) applyRemove(root, step)
        log.ok('upgrade', dryRun ? `would remove ${label}` : `removed ${label}`)
        changed.push(step.path)
        continue
      }

      applyStep(root, step, step.incoming, dryRun)
      const verb = step.action === 'add' ? 'added' : 'replaced'
      log.ok('upgrade', dryRun ? `would ${step.action} ${label}` : `${verb} ${label}`)
      changed.push(step.path)
    }

    if (dryRun || conflicts.length) {
      if (conflicts.length && !dryRun) {
        log.detail('Incoming copies are next to the files as *.geeknative-new. Fix them, then run upgrade again.')
      }
      return { changed, conflicts }
    }

    writeLock(root, version, incoming)
    log.ok('lock', `geeknative ${version}`)
    await bumpDependency(root, { install, pin: doPin })
    if (doGen) gen(root, { quiet: true })
    log.ok('upgrade', `${lock.geeknative} → ${version}`)
    return { changed, conflicts }
  } finally {
    if (cleanup) rmSync(cleanup, { recursive: true, force: true })
  }
}

/**
 * @param {'file' | 'block'} kind
 * @param {Record<string, string>} lockHashes
 * @param {Record<string, Buffer | string>} current
 * @param {Record<string, Buffer | string>} incoming
 * @returns {Step[]}
 */
function planKind(kind, lockHashes, current, incoming) {
  const names = [...new Set([...Object.keys(lockHashes), ...Object.keys(current), ...Object.keys(incoming)])].sort()
  return names.map((name) => ({
    kind,
    path: name,
    action: decide(lockHashes[name], current[name], incoming[name]),
    current: current[name] ?? null,
    incoming: incoming[name] ?? null,
  }))
}

/**
 * @param {string | undefined} lockHash
 * @param {Buffer | string | undefined} current
 * @param {Buffer | string | undefined} incoming
 * @returns {Action}
 */
export function decide(lockHash, current, incoming) {
  const currentHash = current == null ? null : hashContent(current)
  const incomingHash = incoming == null ? null : hashContent(incoming)
  if (incomingHash === currentHash) return 'skip'
  if (incoming == null) return currentHash === lockHash ? 'remove' : 'keep'
  if (current == null) return 'add'
  if (currentHash === lockHash) return 'replace'
  if (incomingHash === lockHash) return 'keep'
  return 'merge'
}

/** @param {Buffer | string | null | undefined} value */
const asText = (value) => (value == null ? '' : typeof value === 'string' ? value : value.toString('utf8'))

/**
 * @param {Buffer | string | null} ours
 * @param {Buffer | string | null | undefined} base
 * @param {Buffer | string | null} theirs
 */
function merge3(ours, base, theirs) {
  if (!capture('git', ['--version'])) return { text: asText(ours), conflict: true }
  const dir = mkdtempSync(path.join(os.tmpdir(), 'geeknative-merge-'))
  try {
    const oursFile = path.join(dir, 'ours')
    const baseFile = path.join(dir, 'base')
    const theirsFile = path.join(dir, 'theirs')
    writeFileSync(oursFile, ours ?? '')
    writeFileSync(baseFile, base ?? '')
    writeFileSync(theirsFile, theirs ?? '')
    const result = spawnSync('git', ['merge-file', '-p', oursFile, baseFile, theirsFile], { encoding: 'utf8' })
    if (result.error) return { text: asText(ours), conflict: true }
    return { text: result.stdout ?? '', conflict: (result.status ?? 1) !== 0 }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** @param {string} root @param {Step} step @param {Buffer | string | null} content @param {boolean} dryRun */
function applyStep(root, step, content, dryRun) {
  if (dryRun || content == null) return
  const full = path.join(root, step.path)
  mkdirSync(path.dirname(full), { recursive: true })
  if (step.kind === 'block') {
    const existing = existsSync(full) ? readFileSync(full, 'utf8') : ''
    writeFileSync(full, replaceBlock(existing, asText(content)))
    return
  }
  writeFileSync(full, content)
}

/** @param {string} root @param {Step} step */
function applyRemove(root, step) {
  const full = path.join(root, step.path)
  if (step.kind === 'block') {
    if (!existsSync(full)) return
    writeFileSync(full, replaceBlock(readFileSync(full, 'utf8'), ''))
    return
  }
  if (existsSync(full)) rmSync(full)
}

/** @param {string} root @param {Step} step */
function writeIncomingSibling(root, step) {
  if (step.incoming == null) return
  const dest = path.join(root, `${step.path}.geeknative-new`)
  mkdirSync(path.dirname(dest), { recursive: true })
  if (step.kind === 'block') {
    const full = path.join(root, step.path)
    const existing = existsSync(full) ? readFileSync(full, 'utf8') : ''
    writeFileSync(dest, replaceBlock(existing, asText(step.incoming)))
    return
  }
  writeFileSync(dest, step.incoming)
}

/**
 * @param {string} root
 * @param {string | undefined} lockVersion
 * @returns {{ template: string | null, cleanup: string | null }}
 */
function findPreviousTemplate(root, lockVersion) {
  const pkgFile = path.join(root, 'package.json')
  if (existsSync(pkgFile)) {
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
    const source = geeknativeSource(pkg.devDependencies?.geeknative, root)
    if (source.kind === 'snapshot' && source.target && existsSync(source.target)) {
      const unpacked = unpackTarballTemplate(source.target)
      if (unpacked) return unpacked
    }
    if (source.kind === 'linked' && source.target) {
      const bundled = path.join(source.target, 'template')
      if (existsSync(bundled)) return { template: bundled, cleanup: null }
      const repoTemplate = path.resolve(source.target, '../../template')
      if (existsSync(repoTemplate)) return { template: repoTemplate, cleanup: null }
    }
  }
  const installed = path.join(root, 'node_modules', 'geeknative')
  const installedTemplate = path.join(installed, 'template')
  const installedPkg = path.join(installed, 'package.json')
  if (existsSync(installedTemplate) && existsSync(installedPkg) && lockVersion) {
    try {
      if (JSON.parse(readFileSync(installedPkg, 'utf8')).version === lockVersion) {
        return { template: installedTemplate, cleanup: null }
      }
    } catch {
      // ignore a broken install and try the registry
    }
  }
  return { template: null, cleanup: null }
}

/** @param {string} tgz */
function unpackTarballTemplate(tgz) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'geeknative-base-'))
  const result = spawnSync('tar', ['-xzf', tgz, '-C', dir])
  if (result.status !== 0) {
    rmSync(dir, { recursive: true, force: true })
    return null
  }
  const nested = path.join(dir, 'package', 'template')
  if (existsSync(nested)) return { template: nested, cleanup: dir }
  rmSync(dir, { recursive: true, force: true })
  return null
}

/** @param {string} version */
function packFromRegistry(version) {
  const dest = mkdtempSync(path.join(os.tmpdir(), 'geeknative-pack-'))
  const packed = capture('npm', ['pack', `geeknative@${version}`, '--ignore-scripts', '--silent', '--pack-destination', dest])
  const name = packed?.split('\n').pop()
  if (!name) {
    rmSync(dest, { recursive: true, force: true })
    return null
  }
  const unpacked = unpackTarballTemplate(path.join(dest, name))
  rmSync(dest, { recursive: true, force: true })
  return unpacked
}

/** @param {string} root @param {{ install: boolean, pin: boolean }} options */
async function bumpDependency(root, { install, pin: doPin }) {
  const pkgFile = path.join(root, 'package.json')
  if (!existsSync(pkgFile)) return
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  const spec = pkg.devDependencies?.geeknative
  const source = geeknativeSource(spec, root)
  if (source.kind === 'snapshot' || source.kind === 'linked') {
    if (doPin && isLocalCheckout()) await pin(root, { install })
    return
  }
  const next = `^${packageVersion()}`
  if (spec === next) return
  pkg.devDependencies = { ...pkg.devDependencies, geeknative: next }
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
  log.ok('geeknative', next)
  if (!install) return
  log.step('install', 'npm install…')
  if ((await runInherit('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root })) !== 0) {
    throw new CliError('npm install failed after upgrading; run it again.')
  }
}
