// End-to-end check of the framework: creates a project from template/ in a temp folder,
// then runs `geeknative check` and `geeknative parity` inside it.
// Usage: npm run smoke [-- ios android web]
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = path.join(repo, 'packages', 'geeknative', 'bin', 'geeknative.js')
const project = path.join(mkdtempSync(path.join(os.tmpdir(), 'geeknative-smoke-')), 'smoke-app')
const targets = process.argv.slice(2)

/** @param {string[]} args @param {string} [cwd] */
function geeknative(args, cwd) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`\nSmoke test failed at \`geeknative ${args.join(' ')}\`. Project left at ${project}`)
    process.exit(result.status ?? 1)
  }
}

geeknative(['create', project, '--name', 'Smoke Test', '--id', 'com.example.smoketest', '--no-git'])
geeknative(['check', ...(targets.length ? targets : ['all'])], project)
geeknative(['parity'], project)
console.log(`\nSmoke test passed. Project: ${project}`)
