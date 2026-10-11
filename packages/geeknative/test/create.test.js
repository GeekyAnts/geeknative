import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { create } from '../src/commands/create.js'
import { gen } from '../src/commands/gen.js'
import { MANAGED_BLOCK_FILES, MANAGED_FILES } from '../src/lib/managed.js'
import { packageVersion } from '../src/lib/project.js'
import { readJson, tempDir } from './helpers.js'

test('create copies the template and applies the app identity everywhere', async () => {
  const dir = path.join(tempDir(), 'acme-notes')
  await create(dir, { name: 'Acme Notes', id: 'com.acme.notes', install: false, git: false })

  const app = readJson(path.join(dir, 'contracts', 'app.json'))
  assert.equal(app.name, 'Acme Notes')
  assert.equal(app.id, 'com.acme.notes')

  const pkg = readJson(path.join(dir, 'package.json'))
  assert.equal(pkg.name, 'acme-notes')
  assert.match(pkg.devDependencies.geeknative, /^file:/, 'a checkout links the local CLI')

  assert.ok(existsSync(path.join(dir, '.gitignore')), '_gitignore becomes .gitignore')
  assert.ok(!existsSync(path.join(dir, '_gitignore')))
  assert.match(readFileSync(path.join(dir, 'README.md'), 'utf8'), /^# Acme Notes$/m)
  assert.match(readFileSync(path.join(dir, 'apps', 'ios', 'Config', 'Identity.xcconfig'), 'utf8'), /APP_BUNDLE_ID = com\.acme\.notes/)
  assert.match(readFileSync(path.join(dir, 'apps', 'android', 'app', 'identity.properties'), 'utf8'), /applicationId=com\.acme\.notes/)
  assert.doesNotThrow(() => gen(dir, { check: true, quiet: true }), 'generated code matches the new identity')

  for (const artifact of ['node_modules', 'apps/ios/.build', 'apps/android/.gradle', 'apps/android/app/build', '.geeknative/logs']) {
    assert.ok(!existsSync(path.join(dir, artifact)), `${artifact} must not be copied`)
  }

  const lock = readJson(path.join(dir, '.geeknative', 'lock.json'))
  assert.equal(lock.geeknative, packageVersion())
  for (const file of MANAGED_FILES) assert.match(lock.files[file], /^sha256-[0-9a-f]{64}$/, file)
  assert.ok(lock.files['.geeknative/playbooks/feature.md'], 'managed folders are hashed file by file')
  for (const file of MANAGED_BLOCK_FILES) assert.match(lock.blocks[file], /^sha256-/, file)
})

test('create derives the name and ID from the folder name', async () => {
  const dir = path.join(tempDir(), 'my-cool-app')
  await create(dir, { install: false, git: false })
  const app = readJson(path.join(dir, 'contracts', 'app.json'))
  assert.equal(app.name, 'My Cool App')
  assert.equal(app.id, 'com.example.mycoolapp')
})

test('create refuses a folder that is not empty', async () => {
  const dir = tempDir()
  writeFileSync(path.join(dir, 'existing.txt'), 'keep me')
  await assert.rejects(create(dir, { install: false, git: false }), /isn't empty/)
})

test('create rejects an invalid app ID before writing anything', async () => {
  const dir = path.join(tempDir(), 'bad-id')
  await assert.rejects(create(dir, { id: 'not a bundle id', install: false, git: false }), /reverse-DNS/)
  assert.ok(!existsSync(dir))
})
