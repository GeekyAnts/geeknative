// @ts-check
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { capture, runInherit } from '../lib/exec.js'
import { copyTemplate } from '../lib/fsutil.js'
import { CliError, color, log } from '../lib/log.js'
import { writeLock } from '../lib/managed.js'
import { isLocalCheckout, PACKAGE_DIR, packCheckout, packageVersion, templateDir } from '../lib/project.js'
import { findAndroidSdk, writeLocalProperties } from '../lib/toolchains.js'
import { validateApp } from '../codegen/app.js'
import { gen } from './gen.js'

/**
 * Creates a new project from the template.
 * @param {string} dir
 * @param {{ name?: string, id?: string, install?: boolean, git?: boolean, link?: boolean }} options
 *   `link`: from a checkout, depend on the checkout itself (it follows whatever branch is open
 *   there) instead of a snapshot of it. For working on geeknative.
 */
export async function create(dir, { name, id, install = true, git = true, link = false }) {
  if (!dir) throw new CliError('Usage: geeknative create <folder> [--name "My App"] [--id com.example.myapp]')
  const root = path.resolve(dir)
  if (existsSync(root) && readdirSync(root).length) throw new CliError(`${dir} already exists and isn't empty.`)

  const slug = path.basename(root).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'app'
  const appName = name?.trim() || titleCase(slug)
  const appId = id ?? `com.example.${slug.replace(/-/g, '')}`
  const version = packageVersion()

  // Fail before writing anything if the name or ID can't work on every platform.
  validateApp({ name: appName, id: appId, version: '1.0.0', build: 1 })

  log.step('create', `${appName} (${appId}) in ${dir}`)
  copyTemplate(templateDir(), root)

  // App identity: the one place the name and ID live. Everything else is generated from it.
  const appFile = path.join(root, 'contracts', 'app.json')
  const app = JSON.parse(readFileSync(appFile, 'utf8'))
  writeFileSync(appFile, `${JSON.stringify({ ...app, name: appName, id: appId }, null, 2)}\n`)

  const pkgFile = path.join(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  pkg.name = slug
  pkg.devDependencies.geeknative = isLocalCheckout() ? localDependency(root, link) : `^${version}`
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)

  for (const doc of ['README.md']) {
    const file = path.join(root, doc)
    if (existsSync(file)) writeFileSync(file, readFileSync(file, 'utf8').replaceAll('{{APP_NAME}}', appName))
  }

  gen(root, { quiet: true })
  writeLock(root, version)
  const sdk = findAndroidSdk(root)
  if (sdk) writeLocalProperties(root, sdk)
  log.ok('create', 'project files written')

  if (install) {
    log.step('install', 'npm install…')
    if ((await runInherit('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root })) !== 0) {
      log.warn('install', 'npm install failed; run it again inside the project')
    } else log.ok('install', 'dependencies installed')
  }

  if (git && capture('git', ['--version'])) {
    capture('git', ['init', '-q'], { cwd: root })
    capture('git', ['add', '-A'], { cwd: root })
    const committed = capture('git', ['commit', '-q', '-m', 'Initial commit from geeknative'], { cwd: root }) !== null
    log.ok('git', committed ? 'repository initialized with a first commit' : 'repository initialized (commit skipped: set git user.name and user.email)')
  }

  log.info(`
${color.bold('Next steps')}
  cd ${dir}
  make doctor          ${color.dim('# checks Xcode, the Android SDK and Node; FIX=1 installs what is missing')}
  make check           ${color.dim('# builds and tests all three apps')}

Then open the folder in your coding agent (Claude Code, Codex, Cursor, Gemini CLI, ...)
and describe the app you want. AGENTS.md tells it how to build it for iOS, Android and web.
`)
}

/**
 * How a project created from a geeknative checkout depends on it: a snapshot of the checkout in
 * .geeknative/ (pinned, so switching branches there never changes this project), or with `link`
 * the checkout itself.
 * @param {string} root
 * @param {boolean} link
 */
function localDependency(root, link) {
  if (link) {
    log.warn('geeknative', `linked to ${PACKAGE_DIR}: this project uses whatever branch is checked out there`)
    return `file:${PACKAGE_DIR}`
  }
  const dir = path.join(root, '.geeknative')
  mkdirSync(dir, { recursive: true })
  const snapshot = packCheckout(dir)
  const source = snapshot.commit ? ` (${snapshot.branch ?? 'detached'} at ${snapshot.commit}${snapshot.dirty ? ', with uncommitted changes' : ''})` : ''
  log.ok('geeknative', `pinned to a snapshot of the local checkout${source}: .geeknative/${snapshot.file}`)
  return `file:.geeknative/${snapshot.file}`
}

/** @param {string} slug */
const titleCase = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
