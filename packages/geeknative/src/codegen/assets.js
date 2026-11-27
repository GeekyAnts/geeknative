// @ts-check
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { CliError } from '../lib/log.js'
import { assertIdentifier, OUT } from './util.js'

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
