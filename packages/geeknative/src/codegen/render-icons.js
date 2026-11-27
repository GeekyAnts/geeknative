// @ts-check
// Renders launcher icons with Sharp. `make gen` stays synchronous, like the rest of codegen,
// and runs this file in a child process. Sharp's API is async, so it does not run in-process.
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'

/** PNG output pinned so two runs on the same Sharp build write the same bytes. */
const PNG = { compressionLevel: 9, effort: 10, adaptiveFiltering: false, force: true }

/**
 * @typedef {{ where: string, min: number, png: string }} Source
 * @typedef {{
 *   icon: Source,
 *   foreground: Source | null,
 *   background: Source | null,
 *   monochrome: Source | null,
 *   ios: number[],
 *   iosOpaque: number[],
 *   launcher: number[],
 *   playStore: number,
 *   favicon: number[],
 *   adaptive: number[],
 * }} Request
 */

/**
 * @param {Request} request
 */
export async function renderIcons(request) {
  const icon = Buffer.from(request.icon.png, 'base64')
  await inspect(icon, request.icon.where, request.icon.min)
  const foreground = request.foreground ? Buffer.from(request.foreground.png, 'base64') : null
  const background = request.background ? Buffer.from(request.background.png, 'base64') : null
  const monochrome = request.monochrome ? Buffer.from(request.monochrome.png, 'base64') : null
  if (foreground && request.foreground) await inspect(foreground, request.foreground.where, request.foreground.min)
  if (background && request.background) await inspect(background, request.background.where, request.background.min)
  if (monochrome && request.monochrome) await inspect(monochrome, request.monochrome.where, request.monochrome.min)

  const paper = await cornerColor(icon)
  /** @type {Record<string, string>} */
  const ios = {}
  for (const size of request.ios) {
    ios[String(size)] = await encode(icon, size, request.iosOpaque.includes(size) ? paper : null)
  }

  /** @type {Record<string, string>} */
  const launcher = {}
  for (const size of request.launcher) launcher[String(size)] = await encode(icon, size, null)

  /** @type {Record<string, string>} */
  const foregroundOut = {}
  /** @type {Record<string, string> | null} */
  let backgroundOut = null
  /** @type {string | null} */
  let backgroundColor = null
  /** @type {Record<string, string> | null} */
  let monochromeOut = null

  if (foreground && background) {
    for (const size of request.adaptive) {
      foregroundOut[String(size)] = await encode(foreground, size, null)
    }
    backgroundOut = {}
    for (const size of request.adaptive) backgroundOut[String(size)] = await encode(background, size, null)
    if (monochrome) {
      monochromeOut = {}
      for (const size of request.adaptive) monochromeOut[String(size)] = await encode(monochrome, size, null)
    }
  } else {
    for (const size of request.adaptive) foregroundOut[String(size)] = await inset(icon, size)
    backgroundColor = hex(paper)
  }

  const faviconPngs = []
  for (const size of request.favicon) {
    faviconPngs.push({ size, png: Buffer.from(await encode(icon, size, paper), 'base64') })
  }

  return {
    ios,
    launcher,
    playStore: await encode(icon, request.playStore, paper),
    favicon: ico(faviconPngs).toString('base64'),
    foreground: foregroundOut,
    background: backgroundOut,
    backgroundColor,
    monochrome: monochromeOut,
  }
}

/**
 * @param {Buffer} input
 * @param {string} where
 * @param {number} min
 */
async function inspect(input, where, min) {
  /** @type {import('sharp').Metadata} */
  let meta
  try {
    meta = await sharp(input).metadata()
  } catch {
    throw new Error(`${where} is not a readable PNG.`)
  }
  if (meta.format !== 'png') throw new Error(`${where} must be a PNG.`)
  if (!meta.width || !meta.height || meta.width !== meta.height) throw new Error(`${where} must be square.`)
  if (meta.width < min) throw new Error(`${where} must be at least ${min}x${min}.`)
}

/**
 * @param {Buffer} input
 * @param {number} size
 * @param {{ r: number, g: number, b: number } | null} flatten
 */
async function encode(input, size, flatten) {
  let image = sharp(input).resize(size, size, { fit: 'fill', kernel: 'lanczos3' })
  if (flatten) image = image.flatten({ background: flatten })
  return (await image.png(PNG).toBuffer()).toString('base64')
}

/** Foreground inset to the 66dp safe zone of the 108dp adaptive canvas. @param {Buffer} input @param {number} canvas */
async function inset(input, canvas) {
  const inner = Math.max(1, Math.round((canvas * 66) / 108))
  const resized = await sharp(input).resize(inner, inner, { fit: 'fill', kernel: 'lanczos3' }).png(PNG).toBuffer()
  const out = await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png(PNG)
    .toBuffer()
  return out.toString('base64')
}

/** @param {Buffer} input @returns {Promise<{ r: number, g: number, b: number }>} */
async function cornerColor(input) {
  const { data } = await sharp(input).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true })
  const red = data[0] ?? 255
  const green = data[1] ?? 255
  const blue = data[2] ?? 255
  const alpha = data[3] ?? 255
  if (alpha === 0) return { r: 255, g: 255, b: 255 }
  return { r: red, g: green, b: blue }
}

/** @param {{ r: number, g: number, b: number }} color */
const hex = (color) =>
  ['ff', color.r, color.g, color.b].map((part) => (typeof part === 'number' ? part.toString(16).padStart(2, '0') : part)).join('').toUpperCase()

/**
 * ICO that embeds PNGs. Sharp does not write ICO.
 * @param {{ size: number, png: Buffer }[]} images
 */
function ico(images) {
  const header = 6 + images.length * 16
  const dir = Buffer.alloc(header)
  dir.writeUInt16LE(0, 0)
  dir.writeUInt16LE(1, 2)
  dir.writeUInt16LE(images.length, 4)
  let offset = header
  images.forEach((image, index) => {
    const at = 6 + index * 16
    const dim = image.size >= 256 ? 0 : image.size
    dir.writeUInt8(dim, at)
    dir.writeUInt8(dim, at + 1)
    dir.writeUInt16LE(1, at + 4)
    dir.writeUInt16LE(32, at + 6)
    dir.writeUInt32LE(image.png.length, at + 8)
    dir.writeUInt32LE(offset, at + 12)
    offset += image.png.length
  })
  return Buffer.concat([dir, ...images.map((image) => image.png)])
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  try {
    const request = JSON.parse(readFileSync(0, 'utf8'))
    const rendered = await renderIcons(request)
    process.stdout.write(JSON.stringify(rendered))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
