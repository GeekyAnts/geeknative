// Claude Code Stop hook (managed by geeknative).
// If the uncommitted changes touch some apps but not the others, remind the agent once,
// since requests apply to all three apps unless they're platform-specific.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk
if (JSON.parse(input || '{}').stop_hook_active) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
/** Runs git in the project folder; paths come back relative to it. @param {string[]} args */
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' })

const tracked = git('diff', '--name-only', '--relative', 'HEAD', '--', 'apps')
const untracked = git('ls-files', '--others', '--exclude-standard', '--', 'apps')
if (tracked.status !== 0 || untracked.status !== 0) process.exit(0) // not a git repo, or no commits yet

// Generated code and agent docs don't count as implementing a change.
const ignored = /(\/Generated\/|\/generated\/|\/generated_[^/]*\.xml$|Identity\.xcconfig$|identity\.properties$|AGENTS\.md$|CLAUDE\.md$)/
const changed = [...tracked.stdout.split('\n'), ...untracked.stdout.split('\n')]
  .filter((file) => file.startsWith('apps/') && !ignored.test(file))
  .sort()

const names = { ios: 'iOS', android: 'Android', web: 'web' }
const touched = Object.keys(names).filter((p) => changed.some((file) => file.startsWith(`apps/${p}/`)))
if (touched.length === 0 || touched.length === 3) process.exit(0)

// Remind only once per set of changes.
const fingerprint = createHash('sha1').update(changed.join('\n')).digest('hex')
const stateFile = path.resolve(root, git('rev-parse', '--git-dir').stdout.trim(), 'geeknative-parity-guard')
let last = ''
try {
  last = readFileSync(stateFile, 'utf8')
} catch {}
if (last === fingerprint) process.exit(0)
writeFileSync(stateFile, fingerprint)

const missing = Object.keys(names).filter((p) => !touched.includes(p))
const list = (/** @type {string[]} */ platforms) =>
  platforms.map((p) => names[/** @type {keyof typeof names} */ (p)]).join(' and ')
console.error(
  `Parity check: the uncommitted changes touch ${list(touched)} but not ${list(missing)}. ` +
    'If this request applies to every app, implement it there too (AGENTS.md section 1). ' +
    "If it's intentionally platform-specific, say so in your report and note it in the spec's Platform notes. Then finish.",
)
process.exit(2)
