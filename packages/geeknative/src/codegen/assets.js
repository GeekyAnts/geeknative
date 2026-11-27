// @ts-check
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CliError } from '../lib/log.js'
import { assertIdentifier, OUT, xcodeJson } from './util.js'

const SOURCE = 'assets'

/** @typedef {{ path: string, content: string | Buffer }} Output */
/** @typedef {'images' | 'videos' | 'documents'} Group */
/** @typedef {{ group: Group, name: string, file: string, data: Buffer }} Asset */

/** Folders copied into each app unchanged. The extension is the whole check. */
const GROUPS = {
  images: new Set(['.png', '.jpg', '.jpeg', '.webp']),
  videos: new Set(['.mp4', '.mov']),
  documents: new Set(['.pdf']),
}

const GROUP_TYPE = {
  images: 'Images',
  videos: 'Videos',
  documents: 'Documents',
}

/**
 * Runtime files under assets/. Missing assets/ is an empty set: icon generation
 * has its own rules, and a project can have no photos yet.
 * @param {string} root
 * @returns {Asset[]}
 */
export function readRuntimeAssets(root) {
  const dir = path.join(root, 'assets')
  if (!existsSync(dir)) return []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const known =
      entry.name in GROUPS ||
      (entry.isDirectory() && entry.name === 'android') ||
      (entry.isFile() && entry.name === 'icon.png')
    if (!known) {
      const hint =
        entry.name === 'fonts'
          ? 'Fonts stay in contracts/fonts (`make font`).'
          : 'Use images/, videos/, documents/, icon.png, or android/.'
      throw new CliError(`assets/${entry.name} is not a known asset. ${hint}`)
    }
  }
  return /** @type {Group[]} */ (Object.keys(GROUPS)).flatMap((group) => readGroup(root, group))
}

/**
 * Copies each runtime file into the three apps and writes AppAssets.
 * Bytes are unchanged: platforms bundle the file, they do not need a resized copy.
 * @param {Asset[]} assets
 * @returns {Output[]}
 */
export function runtimeOutputs(assets) {
  /** @type {Output[]} */
  const copies = assets.flatMap((asset) => {
    const relative = `${asset.group}/${asset.file}`
    return [
      { path: `${OUT.iosGenerated}/Assets/${relative}`, content: asset.data },
      { path: `${OUT.androidRes.replace(/\/res$/, '/assets')}/generated/${relative}`, content: asset.data },
      { path: `${OUT.webGenerated}/assets/${relative}`, content: asset.data },
    ]
  })
  return [
    ...copies,
    { path: `${OUT.iosGenerated}/AppAssets.swift`, content: swiftAssets(assets) },
    { path: `${OUT.androidKotlin}/AppAssets.kt`, content: kotlinAssets(assets) },
    { path: `${OUT.webGenerated}/assets.ts`, content: tsAssets(assets) },
  ]
}

/** Android asset copies live beside res/, not inside it. */
export const ANDROID_ASSET_DIR = 'apps/android/app/src/main/assets/generated'

/** The hand-written catalog the generator replaces. `make gen` deletes it. */
export const LEGACY_APP_ICON = 'apps/ios/App/Resources/Assets.xcassets/AppIcon.appiconset'

/** Play listing artwork. It sits outside res/, so it is not packaged into the APK. */
export const PLAY_STORE_ICON = 'apps/android/app/src/main/ic_launcher-playstore.png'

export const FAVICON = 'apps/web/public/favicon.ico'
export const LEGACY_FAVICON = 'apps/web/public/favicon.svg'

/**
 * @param {string} root
 * @param {Group} group
 * @returns {Asset[]}
 */
function readGroup(root, group) {
  const dir = path.join(root, 'assets', group)
  if (!existsSync(dir)) return []
  const allowed = [...GROUPS[group]].join(', ')
  /** @type {Asset[]} */
  const assets = []
  const used = new Map()
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const where = `assets/${group}/${entry.name}`
    if (entry.isDirectory()) {
      throw new CliError(`${where} is a folder. Put files directly in assets/${group}/.`)
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!GROUPS[group].has(ext)) {
      throw new CliError(`${where} must be one of ${allowed}.`)
    }
    const stem = path.basename(entry.name, path.extname(entry.name))
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem)) {
      throw new CliError(
        `${where}: name it in lowercase words, like "logo.png" or "empty-state.png", so it can be an identifier on every platform.`,
      )
    }
    const name = stem.split('-').map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1))).join('')
    assertIdentifier(name, where)
    if (used.has(name)) {
      throw new CliError(`${where} and ${used.get(name)} would both be named "${name}". Rename one.`)
    }
    used.set(name, where)
    assets.push({ group, name, file: entry.name, data: readFileSync(path.join(dir, entry.name)) })
  }
  assets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return assets
}

/** @param {Asset[]} assets @param {Group} group */
const inGroup = (assets, group) => assets.filter((asset) => asset.group === group)

/** @param {Asset[]} assets */
function swiftAssets(assets) {
  const groups = /** @type {Group[]} */ (Object.keys(GROUPS)).map((group) => {
    const members = inGroup(assets, group)
      .map((asset) => `        /// ${SOURCE}/${group}/${asset.file}\n        static let ${asset.name} = AppAssets.file("${asset.file}")`)
      .join('\n')
    return members ? `    enum ${GROUP_TYPE[group]} {\n${members}\n    }` : `    enum ${GROUP_TYPE[group]} {}`
  })
  const lookup = assets.length
    ? `
    /// The bundled copy of a file from ${SOURCE}/. Xcode copies resources by file name.
    static func file(_ name: String) -> URL {
        let base = (name as NSString).deletingPathExtension
        let ext = (name as NSString).pathExtension
        guard let url = Bundle.main.url(forResource: base, withExtension: ext.isEmpty ? nil : ext) else {
            preconditionFailure("Missing bundled asset \\(name). Run make gen.")
        }
        return url
    }
`
    : ''
  return `// GENERATED by geeknative from ${SOURCE}/. Do not edit: change the files in ${SOURCE}/, then run \`make gen\`.
import Foundation

/// Photos, video and documents from ${SOURCE}/. Add a file there and run \`make gen\`.
nonisolated enum AppAssets {
${groups.join('\n\n')}
${lookup}}
`
}

/** @param {Asset[]} assets */
function kotlinAssets(assets) {
  const groups = /** @type {Group[]} */ (Object.keys(GROUPS)).map((group) => {
    const members = inGroup(assets, group)
      .map((asset) => `        /** ${SOURCE}/${group}/${asset.file} */\n        const val ${asset.name} = "generated/${group}/${asset.file}"`)
      .join('\n')
    const body = members ? ` {\n${members}\n    }` : ''
    return `    object ${GROUP_TYPE[group]}${body}`
  })
  return `// GENERATED by geeknative from ${SOURCE}/. Do not edit: change the files in ${SOURCE}/, then run \`make gen\`.
package app.generated

/** Photos, video and documents from ${SOURCE}/. Paths are relative to the AssetManager. */
object AppAssets {
${groups.join('\n\n')}
}
`
}

/** @param {Asset[]} assets */
function tsAssets(assets) {
  const groups = /** @type {Group[]} */ (Object.keys(GROUPS)).map((group) => {
    const members = inGroup(assets, group)
      .map((asset) => `    /** ${SOURCE}/${group}/${asset.file} */\n    ${asset.name}: new URL('./assets/${group}/${asset.file}', import.meta.url).href,`)
      .join('\n')
    return members ? `  ${group}: {\n${members}\n  },` : `  ${group}: {},`
  })
  return `// GENERATED by geeknative from ${SOURCE}/. Do not edit: change the files in ${SOURCE}/, then run \`make gen\`.

/** Photos, video and documents from ${SOURCE}/. Values are URLs Vite can bundle. */
export const AppAssets = {
${groups.join('\n')}
} as const
`
}

const IOS_SLOTS = [
  { idiom: 'iphone', size: '20x20', scale: '2x', px: 40 },
  { idiom: 'iphone', size: '20x20', scale: '3x', px: 60 },
  { idiom: 'iphone', size: '29x29', scale: '2x', px: 58 },
  { idiom: 'iphone', size: '29x29', scale: '3x', px: 87 },
  { idiom: 'iphone', size: '40x40', scale: '2x', px: 80 },
  { idiom: 'iphone', size: '40x40', scale: '3x', px: 120 },
  { idiom: 'iphone', size: '60x60', scale: '2x', px: 120 },
  { idiom: 'iphone', size: '60x60', scale: '3x', px: 180 },
  { idiom: 'ipad', size: '20x20', scale: '1x', px: 20 },
  { idiom: 'ipad', size: '20x20', scale: '2x', px: 40 },
  { idiom: 'ipad', size: '29x29', scale: '1x', px: 29 },
  { idiom: 'ipad', size: '29x29', scale: '2x', px: 58 },
  { idiom: 'ipad', size: '40x40', scale: '1x', px: 40 },
  { idiom: 'ipad', size: '40x40', scale: '2x', px: 80 },
  { idiom: 'ipad', size: '76x76', scale: '1x', px: 76 },
  { idiom: 'ipad', size: '76x76', scale: '2x', px: 152 },
  { idiom: 'ipad', size: '83.5x83.5', scale: '2x', px: 167 },
  { idiom: 'ios-marketing', size: '1024x1024', scale: '1x', px: 1024 },
]

const LAUNCHER_DENSITIES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
]

const ADAPTIVE_DENSITIES = [
  ['mdpi', 108],
  ['hdpi', 162],
  ['xhdpi', 216],
  ['xxhdpi', 324],
  ['xxxhdpi', 432],
]

const LAUNCHER_PNGS = [
  'ic_launcher.png',
  'ic_launcher_round.png',
  'ic_launcher_foreground.png',
  'ic_launcher_background.png',
  'ic_launcher_monochrome.png',
]

const DEFAULT_ICON = readFileSync(new URL('./default-icon.png', import.meta.url))

/**
 * Launcher files this generator owns, including the placeholders it replaces.
 * Only paths that exist are returned, so a missing file is not reported as stale.
 * @param {string} root
 * @returns {string[]}
 */
export function ownedIconFiles(root) {
  /** @type {string[]} */
  const candidates = []
  for (const [density] of LAUNCHER_DENSITIES) {
    for (const name of LAUNCHER_PNGS) candidates.push(`${OUT.androidRes}/mipmap-${density}/${name}`)
  }
  candidates.push(
    `${OUT.androidRes}/mipmap-anydpi-v26/ic_launcher.xml`,
    `${OUT.androidRes}/mipmap-anydpi-v26/ic_launcher_round.xml`,
    `${OUT.androidRes}/mipmap/ic_launcher.xml`,
    `${OUT.androidRes}/mipmap/ic_launcher_round.xml`,
    `${OUT.androidRes}/drawable/ic_launcher_foreground.xml`,
    `${OUT.androidRes}/values/ic_launcher_background.xml`,
    PLAY_STORE_ICON,
    FAVICON,
    LEGACY_FAVICON,
  )
  return candidates.filter((file) => existsSync(path.join(root, file)))
}

/**
 * Reads the master icon and the optional Android layers.
 * A missing icon.png warns and uses the built-in mark, so generation still has a source.
 * @param {string} root
 * @returns {{ warnings: string[], outputs: Output[] }}
 */
export function launcherOutputs(root) {
  const warnings = []
  const iconFile = path.join(root, 'assets', 'icon.png')
  const icon = existsSync(iconFile) ? readFileSync(iconFile) : null
  if (!icon) warnings.push('assets/icon.png is missing, so the built-in icon was used.')

  const layer = (/** @type {string} */ name) => {
    const file = path.join(root, 'assets', 'android', name)
    return existsSync(file) ? readFileSync(file) : null
  }
  const foreground = layer('foreground.png')
  const background = layer('background.png')
  const monochrome = layer('monochrome.png')
  if (Boolean(foreground) !== Boolean(background)) {
    throw new CliError(
      foreground ? 'assets/android/background.png is missing.' : 'assets/android/foreground.png is missing.',
    )
  }
  if (monochrome && !foreground) {
    throw new CliError('assets/android/monochrome.png needs foreground.png and background.png.')
  }

  const rendered = renderIcons({
    icon: source(icon ?? DEFAULT_ICON, 'assets/icon.png', 1024),
    foreground: foreground ? source(foreground, 'assets/android/foreground.png', 432) : null,
    background: background ? source(background, 'assets/android/background.png', 432) : null,
    monochrome: monochrome ? source(monochrome, 'assets/android/monochrome.png', 432) : null,
    ios: [...new Set(IOS_SLOTS.map((slot) => slot.px))],
    iosOpaque: [1024],
    launcher: LAUNCHER_DENSITIES.map(([, size]) => size),
    playStore: 512,
    favicon: [16, 32, 48],
    adaptive: ADAPTIVE_DENSITIES.map(([, size]) => size),
  })

  return { warnings, outputs: iconFiles(rendered) }
}

/**
 * @param {Buffer} png
 * @param {string} where
 * @param {number} min
 */
function source(png, where, min) {
  return { where, min, png: png.toString('base64') }
}

/** @param {RenderedIcons} rendered */
function iconFiles(rendered) {
  const catalog = `${OUT.iosGenerated}/AppIcon.xcassets`
  const set = `${catalog}/AppIcon.appiconset`
  /** @type {Output[]} */
  const outputs = [
    { path: `${catalog}/Contents.json`, content: `${xcodeJson({ info: { author: 'xcode', version: 1 } })}\n` },
    {
      path: `${set}/Contents.json`,
      content: `${xcodeJson({
        images: IOS_SLOTS.map((slot) => ({
          filename: `icon-${slot.px}.png`,
          idiom: slot.idiom,
          scale: slot.scale,
          size: slot.size,
        })),
        info: { author: 'xcode', version: 1 },
      })}\n`,
    },
  ]
  const written = new Set()
  for (const slot of IOS_SLOTS) {
    if (written.has(slot.px)) continue
    written.add(slot.px)
    outputs.push({ path: `${set}/icon-${slot.px}.png`, content: Buffer.from(rendered.ios[String(slot.px)], 'base64') })
  }

  for (const [density, size] of LAUNCHER_DENSITIES) {
    const png = Buffer.from(rendered.launcher[String(size)], 'base64')
    outputs.push({ path: `${OUT.androidRes}/mipmap-${density}/ic_launcher.png`, content: png })
    outputs.push({ path: `${OUT.androidRes}/mipmap-${density}/ic_launcher_round.png`, content: png })
  }
  outputs.push({ path: PLAY_STORE_ICON, content: Buffer.from(rendered.playStore, 'base64') })
  outputs.push({ path: FAVICON, content: Buffer.from(rendered.favicon, 'base64') })

  for (const [density, size] of ADAPTIVE_DENSITIES) {
    outputs.push({
      path: `${OUT.androidRes}/mipmap-${density}/ic_launcher_foreground.png`,
      content: Buffer.from(rendered.foreground[String(size)], 'base64'),
    })
    if (rendered.background) {
      outputs.push({
        path: `${OUT.androidRes}/mipmap-${density}/ic_launcher_background.png`,
        content: Buffer.from(rendered.background[String(size)], 'base64'),
      })
    }
    if (rendered.monochrome) {
      outputs.push({
        path: `${OUT.androidRes}/mipmap-${density}/ic_launcher_monochrome.png`,
        content: Buffer.from(rendered.monochrome[String(size)], 'base64'),
      })
    }
  }

  const backgroundRef = rendered.background ? '@mipmap/ic_launcher_background' : '@color/ic_launcher_background'
  const monoRef = rendered.monochrome ? '@mipmap/ic_launcher_monochrome' : null
  const xml = adaptiveXml(backgroundRef, monoRef)
  outputs.push({ path: `${OUT.androidRes}/mipmap-anydpi-v26/ic_launcher.xml`, content: xml })
  outputs.push({ path: `${OUT.androidRes}/mipmap-anydpi-v26/ic_launcher_round.xml`, content: xml })
  if (rendered.backgroundColor) {
    outputs.push({
      path: `${OUT.androidRes}/values/generated_ic_launcher_background.xml`,
      content: `<?xml version="1.0" encoding="utf-8"?>
<!-- GENERATED by geeknative from assets/icon.png. Do not edit: change the asset, then run \`make gen\`. -->
<resources>
    <color name="ic_launcher_background">#${rendered.backgroundColor}</color>
</resources>
`,
    })
  }
  return outputs
}

/**
 * @param {string} background
 * @param {string | null} monochrome
 */
function adaptiveXml(background, monochrome) {
  const mono = monochrome ? `\n    <monochrome android:drawable="${monochrome}" />` : ''
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- GENERATED by geeknative from assets/icon.png. Do not edit: change the asset, then run \`make gen\`. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="${background}" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />${mono}
</adaptive-icon>
`
}

/**
 * @typedef {{
 *   ios: Record<string, string>,
 *   launcher: Record<string, string>,
 *   playStore: string,
 *   favicon: string,
 *   foreground: Record<string, string>,
 *   background: Record<string, string> | null,
 *   backgroundColor: string | null,
 *   monochrome: Record<string, string> | null,
 * }} RenderedIcons
 */

/** @param {object} request @returns {RenderedIcons} */
function renderIcons(request) {
  const script = fileURLToPath(new URL('./render-icons.js', import.meta.url))
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(request),
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) {
    const message = (result.stderr ?? result.stdout)?.toString().trim() || result.error?.message || 'Could not render icons.'
    throw new CliError(message.split('\n')[0] ?? message)
  }
  return JSON.parse(result.stdout.toString())
}
