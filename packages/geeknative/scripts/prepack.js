// Bundles the repo's template/ into the package before `npm pack` / `npm publish`,
// and removes the copy afterwards (`--clean`), so a checkout always uses template/ directly.
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyTemplate } from '../src/lib/fsutil.js'

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundled = path.join(packageDir, 'template')

rmSync(bundled, { recursive: true, force: true })
if (!process.argv.includes('--clean')) {
  // Keep `_gitignore` names: npm drops real .gitignore files, so `create` renames them on copy.
  copyTemplate(path.resolve(packageDir, '../../template'), bundled, { keepGitignoreNames: true })
}
