import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { readRuntimeAssets } from '../src/codegen/assets.js'
import { generate, staleFiles } from '../src/codegen/index.js'
import { gen } from '../src/commands/gen.js'
import { outputOf, tempProject } from './helpers.js'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** @param {string} dir @param {string} relative @param {Buffer | string} data */
function put(dir, relative, data) {
  const file = path.join(dir, relative)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, data)
}

test('runtime assets are copied unchanged and named on every platform', () => {
  const dir = tempProject()
  put(dir, 'assets/images/empty-state.png', PNG)
  put(dir, 'assets/videos/intro.mp4', Buffer.from('video-bytes'))
  put(dir, 'assets/documents/terms.pdf', Buffer.from('%PDF-1.1'))
  put(dir, 'assets/images/.gitkeep', '')

  const outputs = generate(dir)
  const copies = [
    ['apps/ios/App/Generated/Assets/images/empty-state.png', PNG],
    ['apps/android/app/src/main/assets/generated/images/empty-state.png', PNG],
    ['apps/web/src/generated/assets/images/empty-state.png', PNG],
    ['apps/ios/App/Generated/Assets/videos/intro.mp4', Buffer.from('video-bytes')],
    ['apps/android/app/src/main/assets/generated/documents/terms.pdf', Buffer.from('%PDF-1.1')],
  ]
  for (const [suffix, bytes] of copies) {
    const output = outputs.find((item) => item.path === suffix)
    assert.ok(output, suffix)
    assert.ok(Buffer.isBuffer(output.content) && output.content.equals(bytes), `${suffix} was transformed`)
  }
  assert.ok(!outputs.some((item) => item.path.endsWith('.gitkeep')))

  assert.match(outputOf(outputs, 'AppAssets.swift'), /static let emptyState = AppAssets\.file\("empty-state\.png"\)/)
  assert.match(outputOf(outputs, 'AppAssets.swift'), /static let intro = AppAssets\.file\("intro\.mp4"\)/)
  assert.match(outputOf(outputs, 'AppAssets.swift'), /static let terms = AppAssets\.file\("terms\.pdf"\)/)
  assert.match(outputOf(outputs, 'AppAssets.kt'), /const val emptyState = "generated\/images\/empty-state\.png"/)
  assert.match(outputOf(outputs, 'assets.ts'), /emptyState: new URL\('\.\/assets\/images\/empty-state\.png', import\.meta\.url\)\.href/)
})

test('a removed runtime asset is deleted from the apps', () => {
  const dir = tempProject()
  put(dir, 'assets/images/logo.png', PNG)
  gen(dir, { quiet: true })
  rmSync(path.join(dir, 'assets/images/logo.png'))
  const { removed } = gen(dir, { quiet: true })
  for (const suffix of [
    'apps/ios/App/Generated/Assets/images/logo.png',
    'apps/android/app/src/main/assets/generated/images/logo.png',
    'apps/web/src/generated/assets/images/logo.png',
  ]) {
    assert.ok(removed.includes(suffix), suffix)
  }
})

test('an asset left behind under the Android assets folder is pruned', () => {
  const dir = tempProject()
  const produced = new Set(generate(dir).map((item) => item.path))
  put(dir, 'apps/android/app/src/main/assets/generated/images/gone.png', PNG)
  const stale = staleFiles(dir, produced)
  assert.ok(stale.includes('apps/android/app/src/main/assets/generated/images/gone.png'))
})

test('runtime asset names and types are checked', () => {
  const dir = tempProject()
  put(dir, 'assets/images/Logo.png', PNG)
  assert.throws(() => readRuntimeAssets(dir), /lowercase words/)

  rmSync(path.join(dir, 'assets/images/Logo.png'))
  put(dir, 'assets/images/notes.txt', 'hello')
  assert.throws(() => readRuntimeAssets(dir), /must be one of/)

  put(dir, 'assets/fonts/Inter.ttf', 'font')
  assert.throws(() => readRuntimeAssets(dir), /contracts\/fonts/)
})
