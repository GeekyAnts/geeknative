// Publishes the built site (dist/) to the gh-pages branch, which GitHub Pages serves.
// CI does this on every push to main (.github/workflows/docs.yml). `npm run deploy` does it by hand.
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (!existsSync(path.join(dist, 'index.html'))) throw new Error('Run `npm run build` first.')

const remote = process.env.DEPLOY_REMOTE ?? execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()
const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
/** @param {string[]} args */
const git = (...args) => execFileSync('git', args, { cwd: dist, stdio: 'inherit' })

rmSync(path.join(dist, '.git'), { recursive: true, force: true })
writeFileSync(path.join(dist, '.nojekyll'), '') // serve _astro/ and other underscore folders as-is
git('init', '-q', '-b', 'gh-pages')
git('add', '-A')
const trailer = process.env.DEPLOY_TRAILER ? `\n\n${process.env.DEPLOY_TRAILER}` : ''
git('commit', '-q', '-m', `Deploy docs from ${sha}${trailer}`)
git('push', '-f', '-q', remote, 'gh-pages')
rmSync(path.join(dist, '.git'), { recursive: true, force: true })
console.log(`Deployed ${sha} to the gh-pages branch.`)
