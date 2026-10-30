// The Claude Code hooks shipped in template/.geeknative/hooks, run the way Claude Code runs them.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { appendFileSync, chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { CLI, editJson, TEMPLATE, tempDir, tempProject } from './helpers.js'

const HOOKS = path.join(TEMPLATE, '.geeknative', 'hooks')

/**
 * @param {string} hook file name
 * @param {string} projectDir CLAUDE_PROJECT_DIR
 * @param {object} [input] JSON on stdin
 * @param {string[]} [args]
 */
function runHook(hook, projectDir, input = {}, args = []) {
  return spawnSync(process.execPath, [path.join(HOOKS, hook), ...args], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  })
}

// ---------- parity-guard (Stop) ----------

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
}

/** A git repo with one committed file per app. */
function appsRepo() {
  const dir = tempDir()
  const git = (/** @type {string[]} */ ...args) => spawnSync('git', args, { cwd: dir, env: gitEnv, encoding: 'utf8' })
  git('init', '-q')
  for (const file of ['apps/ios/App/A.swift', 'apps/android/app/B.kt', 'apps/web/src/c.ts']) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), 'original\n')
  }
  git('add', '-A')
  git('commit', '-qm', 'initial')
  return dir
}

test('parity-guard reminds the agent once when only some apps changed', () => {
  const dir = appsRepo()
  appendFileSync(path.join(dir, 'apps/ios/App/A.swift'), 'change\n')

  const first = runHook('parity-guard.mjs', dir)
  assert.equal(first.status, 2, 'blocks the stop')
  assert.match(first.stderr, /touch iOS but not Android and web/)

  const second = runHook('parity-guard.mjs', dir)
  assert.equal(second.status, 0, 'stays quiet for the same set of changes')

  appendFileSync(path.join(dir, 'apps/android/app/B.kt'), 'change\n')
  const third = runHook('parity-guard.mjs', dir)
  assert.equal(third.status, 2, 'a new set of changes gets a new reminder')
  assert.match(third.stderr, /touch iOS and Android but not web/)
})

test('parity-guard is silent when every app changed, or only generated files did', () => {
  const dir = appsRepo()
  mkdirSync(path.join(dir, 'apps/ios/App/Generated'), { recursive: true })
  writeFileSync(path.join(dir, 'apps/ios/App/Generated/Strings.swift'), '// generated\n')
  assert.equal(runHook('parity-guard.mjs', dir).status, 0, 'generated code does not count')

  for (const file of ['apps/ios/App/A.swift', 'apps/android/app/B.kt', 'apps/web/src/c.ts']) {
    appendFileSync(path.join(dir, file), 'change\n')
  }
  assert.equal(runHook('parity-guard.mjs', dir).status, 0)
})

test('parity-guard never loops and ignores folders without git', () => {
  const dir = appsRepo()
  appendFileSync(path.join(dir, 'apps/web/src/c.ts'), 'change\n')
  assert.equal(runHook('parity-guard.mjs', dir, { stop_hook_active: true }).status, 0)
  assert.equal(runHook('parity-guard.mjs', tempDir()).status, 0)
})

// ---------- after-edit (PostToolUse) ----------

/** A project with contracts/ and a node_modules/.bin/geeknative shim pointing at this checkout's CLI. */
function projectWithCli() {
  const dir = tempProject()
  const bin = path.join(dir, 'node_modules', '.bin', 'geeknative')
  mkdirSync(path.dirname(bin), { recursive: true })
  writeFileSync(bin, `#!/bin/sh\nexec "${process.execPath}" "${CLI}" "$@"\n`)
  chmodSync(bin, 0o755)
  return dir
}

test('after-edit ignores files outside contracts/', () => {
  const dir = projectWithCli()
  const result = runHook('after-edit.mjs', dir, { tool_input: { file_path: path.join(dir, 'README.md') } })
  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})

test('after-edit regenerates code when a contract changes', () => {
  const dir = projectWithCli()
  const result = runHook('after-edit.mjs', dir, { tool_input: { file_path: path.join(dir, 'contracts', 'tokens.json') } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse')
  assert.match(output.hookSpecificOutput.additionalContext, /regenerated the app code/)
})

test('after-edit regenerates when the root .env changes, so AppSecrets stay current', () => {
  const dir = projectWithCli()
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => (config.secrets = { mapsApiKey: { type: 'string' } }))
  writeFileSync(path.join(dir, '.env'), 'MAPS_API_KEY=fresh\n')
  const result = runHook('after-edit.mjs', dir, { tool_input: { file_path: path.join(dir, '.env') } })
  assert.equal(result.status, 0, result.stderr)
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /^\.env changed/)
  assert.match(readFileSync(path.join(dir, 'apps/ios/App/Generated/AppSecrets.swift'), 'utf8'), /"fresh"/)
})

test('after-edit ignores a .env in a subfolder', () => {
  const dir = projectWithCli()
  assert.equal(runHook('after-edit.mjs', dir, { tool_input: { file_path: path.join(dir, 'apps', '.env') } }).stdout, '')
})

test('after-edit reports a broken contract back to the agent', () => {
  const dir = projectWithCli()
  editJson(path.join(dir, 'contracts', 'tokens.json'), (tokens) => (tokens.color.primary.light = 'blue'))
  const result = runHook('after-edit.mjs', dir, { tool_input: { file_path: path.join(dir, 'contracts', 'tokens.json') } })
  assert.equal(result.status, 2, 'exit 2 shows stderr to Claude')
  assert.match(result.stderr, /make gen` failed after editing contracts\/tokens\.json[\s\S]*hex color/)
})

// ---------- subagent-context (SubagentStart) ----------

test('subagent-context gives each platform subagent its AGENTS.md', () => {
  for (const [platform, heading] of [['ios', '# iOS app'], ['android', '# Android app'], ['web', '# Web app']]) {
    const result = runHook('subagent-context.mjs', TEMPLATE, {}, [platform])
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.hookSpecificOutput.hookEventName, 'SubagentStart')
    assert.ok(output.hookSpecificOutput.additionalContext.includes(heading), platform)
  }
  assert.equal(runHook('subagent-context.mjs', TEMPLATE, {}, ['desktop']).stdout, '', 'unknown platforms get nothing')
})
