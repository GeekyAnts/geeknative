// @ts-check
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { generate, staleFiles } from '../codegen/index.js'
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
  const outputs = generate(root)
  /** @type {string[]} */
  const changed = []
  for (const output of outputs) {
    const file = path.join(root, output.path)
    if (check) {
      const next = typeof output.content === 'string' ? Buffer.from(output.content) : output.content
      if (!existsSync(file) || !readFileSync(file).equals(next)) changed.push(output.path)
    } else if (writeIfChanged(file, output.content)) {
      changed.push(output.path)
    }
  }
  const removed = staleFiles(root, new Set(outputs.map((o) => o.path)))
  if (!check) for (const file of removed) rmSync(path.join(root, file))

  if (check && (changed.length || removed.length)) {
    throw new CliError(
      `Generated files are out of date:\n${[...changed, ...removed].map((f) => `  ${f}`).join('\n')}\nRun \`make gen\`, and never edit generated files by hand.`,
    )
  }
  if (!quiet) {
    if (check) log.ok('contracts', 'valid, generated files up to date')
    else if (changed.length || removed.length) {
      log.ok('gen', `${changed.length} file${changed.length === 1 ? '' : 's'} updated${removed.length ? `, ${removed.length} removed` : ''}`)
      for (const file of [...changed, ...removed]) log.detail(file)
    } else log.ok('gen', 'already up to date')
  }
  return { changed, removed }
}
