// @ts-check
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { generateAll, staleFiles } from '../codegen/index.js'
import { LEGACY_APP_ICON } from '../codegen/assets.js'
import { writeIfChanged } from '../lib/fsutil.js'
import { CliError, log } from '../lib/log.js'

/**
 * Regenerates platform code from contracts/. With `check`, writes nothing and fails if
 * anything is out of date (used by `geeknative check`).
 * @param {string} root
 * @param {{ check?: boolean, quiet?: boolean }} [options]
 * @returns {{ changed: string[], removed: string[] }}
 */
export function gen(root, { check = false, quiet = false } = {}) {
  const { outputs, warnings, assetWarnings } = generateAll(root)
  /** @type {string[]} */
  const changed = []
  for (const output of outputs) {
    const file = path.join(root, output.path)
    if (output.local) {
      // Built from .env and gitignored (AppSecrets.*). Always written, even in check mode, so a fresh
      // clone compiles; never compared, because the committed tree can't contain it.
      const written = writeIfChanged(file, output.content)
      if (written && !check) changed.push(output.path)
      continue
    }
    if (check) {
      const next = typeof output.content === 'string' ? Buffer.from(output.content) : output.content
      if (!existsSync(file) || !readFileSync(file).equals(next)) changed.push(output.path)
    } else if (writeIfChanged(file, output.content)) {
      changed.push(output.path)
    }
  }
  const removed = staleFiles(root, new Set(outputs.map((o) => o.path)))
  const legacyIcon = path.join(root, LEGACY_APP_ICON)
  const ownsLauncher = existsSync(path.join(root, 'assets', 'icon.png'))
  if (!check) {
    for (const file of removed) rmSync(path.join(root, file), { force: true })
    if (ownsLauncher && existsSync(legacyIcon)) {
      rmSync(legacyIcon, { recursive: true, force: true })
      if (!removed.includes(LEGACY_APP_ICON)) removed.push(LEGACY_APP_ICON)
    }
  } else if (ownsLauncher && existsSync(legacyIcon) && !removed.includes(LEGACY_APP_ICON)) {
    removed.push(LEGACY_APP_ICON)
  }

  if (check && (changed.length || removed.length)) {
    throw new CliError(
      `Generated files are out of date:\n${[...changed, ...removed].map((f) => `  ${f}`).join('\n')}\nRun \`make gen\`, and never edit generated files by hand.`,
    )
  }
  if (!quiet) {
    for (const warning of warnings) log.warn('secrets', warning)
    for (const warning of assetWarnings) log.warn('assets', warning)
    if (check) log.ok('contracts', 'valid, generated files up to date')
    else if (changed.length || removed.length) {
      log.ok('gen', `${changed.length} file${changed.length === 1 ? '' : 's'} updated${removed.length ? `, ${removed.length} removed` : ''}`)
      for (const file of [...changed, ...removed]) log.detail(file)
    } else log.ok('gen', 'already up to date')
  }
  return { changed, removed }
}
