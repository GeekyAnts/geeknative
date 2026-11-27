import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import sharp from 'sharp'
import { launcherOutputs, readRuntimeAssets } from '../src/codegen/assets.js'
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

/** @param {number} width @param {number} height */
const png = (width, height) =>
  sharp({ create: { width, height, channels: 3, background: { r: 79, g: 70, b: 229 } } }).png().toBuffer()

test('icon.png becomes the iOS set, Android densities, Play icon and favicon', async () => {
  const dir = tempProject()
  put(dir, 'assets/icon.png', await png(1024, 1024))
  const first = launcherOutputs(dir)
  const second = launcherOutputs(dir)
  assert.deepEqual(first.warnings, [])
  const byPath = (/** @type {{ path: string, content: string | Buffer }[]} */ outputs, suffix) => {
    const output = outputs.find((item) => item.path.endsWith(suffix))
    assert.ok(output, suffix)
    return output.content
  }
  assert.deepEqual(byPath(first.outputs, 'icon-1024.png'), byPath(second.outputs, 'icon-1024.png'))
  const catalog = JSON.parse(String(byPath(first.outputs, 'AppIcon.appiconset/Contents.json')))
  assert.equal(catalog.images.length, 18)
  assert.ok(catalog.images.some((slot) => slot.idiom === 'ipad' && slot.size === '83.5x83.5'))
  assert.ok(catalog.images.some((slot) => slot.idiom === 'ios-marketing' && slot.size === '1024x1024'))
  for (const [folder, size] of [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ]) {
    const launcher = byPath(first.outputs, `${folder}/ic_launcher.png`)
    const round = byPath(first.outputs, `${folder}/ic_launcher_round.png`)
    assert.ok(Buffer.isBuffer(launcher) && launcher.equals(/** @type {Buffer} */ (round)))
    assert.equal((await sharp(launcher).metadata()).width, size)
  }
  assert.equal((await sharp(/** @type {Buffer} */ (byPath(first.outputs, 'ic_launcher-playstore.png'))).metadata()).width, 512)
  const ico = /** @type {Buffer} */ (byPath(first.outputs, 'favicon.ico'))
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 3)
  const xml = String(byPath(first.outputs, 'mipmap-anydpi-v26/ic_launcher.xml'))
  assert.match(xml, /@color\/ic_launcher_background/)
  assert.doesNotMatch(xml, /monochrome/)
})

test('android foreground and background become adaptive layers, and monochrome is optional', async () => {
  const dir = tempProject()
  put(dir, 'assets/icon.png', await png(1024, 1024))
  put(dir, 'assets/android/foreground.png', await png(432, 432))
  assert.throws(() => launcherOutputs(dir), /background\.png is missing/)
  put(dir, 'assets/android/background.png', await png(432, 432))
  const pair = launcherOutputs(dir)
  const xml = String(pair.outputs.find((item) => item.path.endsWith('ic_launcher.xml'))?.content)
  assert.match(xml, /@mipmap\/ic_launcher_background/)
  assert.doesNotMatch(xml, /monochrome/)
  assert.equal((await sharp(/** @type {Buffer} */ (pair.outputs.find((item) => item.path.endsWith('mipmap-xxxhdpi/ic_launcher_foreground.png'))?.content)).metadata()).width, 432)
  put(dir, 'assets/android/monochrome.png', await png(432, 432))
  const themed = String(launcherOutputs(dir).outputs.find((item) => item.path.endsWith('ic_launcher.xml'))?.content)
  assert.match(themed, /monochrome android:drawable="@mipmap\/ic_launcher_monochrome"/)
})

test('icon validation rejects a bad master and a short adaptive layer', async () => {
  const dir = tempProject()
  put(dir, 'assets/icon.png', Buffer.from('not a png'))
  assert.throws(() => launcherOutputs(dir), /not a readable PNG/)
  put(dir, 'assets/icon.png', await png(1024, 512))
  assert.throws(() => launcherOutputs(dir), /must be square/)
  put(dir, 'assets/icon.png', await png(128, 128))
  assert.throws(() => launcherOutputs(dir), /at least 1024x1024/)
  put(dir, 'assets/icon.png', await png(1024, 1024))
  put(dir, 'assets/android/foreground.png', await png(64, 64))
  put(dir, 'assets/android/background.png', await png(64, 64))
  assert.throws(() => launcherOutputs(dir), /at least 432x432/)
  rmSync(path.join(dir, 'assets/android'), { recursive: true })
  put(dir, 'assets/android/monochrome.png', await png(432, 432))
  assert.throws(() => launcherOutputs(dir), /needs foreground\.png and background\.png/)
})

test('a missing icon.png warns and still renders the built-in mark', () => {
  const { warnings, outputs } = launcherOutputs(tempProject())
  assert.deepEqual(warnings, ['assets/icon.png is missing, so the built-in icon was used.'])
  assert.ok(outputs.some((item) => item.path.endsWith('icon-1024.png')))
})
