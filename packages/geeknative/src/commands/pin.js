// @ts-check
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { runInherit } from '../lib/exec.js'
import { CliError, log } from '../lib/log.js'
import { isLocalCheckout, packCheckout, snapshotSource } from '../lib/project.js'

/**
 * Pins a project to a fresh snapshot of the geeknative checkout it came from, as that checkout
 * is now, and removes the previous snapshot. For projects created from a checkout; projects
 * created from npm update with `npm install geeknative@latest`.
 * @param {string} root
 * @param {{ install?: boolean }} [options]
 */
export async function pin(root, { install = true } = {}) {
  if (!isLocalCheckout()) {
    // Running from a snapshot: hand over to the checkout's own CLI, so the new snapshot is packed
    // by the latest code.
    const source = snapshotSource()
    const cli = source && path.join(source.checkout, 'packages', 'geeknative', 'bin', 'geeknative.js')
    if (!cli || !existsSync(cli)) {
      throw new CliError(
        source
          ? `The checkout this project was pinned from (${source.checkout}) is gone. Run \`node <checkout>/packages/geeknative/bin/geeknative.js pin\` from this folder.`
          : 'This project uses geeknative from npm: update it with `npm install --save-dev geeknative@latest`. To pin it to a checkout, run `node <checkout>/packages/geeknative/bin/geeknative.js pin` from this folder.',
      )
    }
    const code = await runInherit(process.execPath, [cli, 'pin', ...(install ? [] : ['--no-install'])], { cwd: root })
    if (code !== 0) process.exitCode = code
    return
  }

  const pkgFile = path.join(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  const previous = /** @type {string | undefined} */ (pkg.devDependencies?.geeknative)
  const dir = path.join(root, '.geeknative')
  const snapshot = packCheckout(dir)
  const next = `file:.geeknative/${snapshot.file}`
  const where = `${snapshot.branch ?? 'detached'} at ${snapshot.commit}${snapshot.dirty ? ', with uncommitted changes' : ''}`

  if (previous === next) {
    log.ok('pin', `already pinned to ${snapshot.file} (${where})`)
    return
  }
  pkg.devDependencies = { ...pkg.devDependencies, geeknative: next }
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
  // The old snapshot is no longer used; keep the folder to one tarball.
  const old = previous?.match(/^file:(\.geeknative\/geeknative-[^/]+\.tgz)$/)?.[1]
  if (old && existsSync(path.join(root, old))) rmSync(path.join(root, old))

  log.ok('pin', `pinned to ${snapshot.file} (${where})${previous ? `, was ${previous.replace(/^file:/, '')}` : ''}`)
  if (!install) return
  log.step('install', 'npm install…')
  if ((await runInherit('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root })) !== 0) {
    throw new CliError('npm install failed after pinning; run it again.')
  }
  log.ok('install', 'the project now uses the new snapshot. Run `make gen` and `make check`.')
}
