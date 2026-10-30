// @ts-check
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseFont } from '../lib/fontfile.js'
import { readJson } from '../lib/fsutil.js'
import { CliError, log } from '../lib/log.js'
import { gen } from './gen.js'

const SOURCE = 'contracts/tokens.json'

/** @type {Record<number, string>} */
const WEIGHT_NAMES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' }

// Google Fonts picks the file format from the user agent: a browser it knows gets WOFF2, anything
// else gets one complete TrueType file per weight, which is the file every platform can use.
const USER_AGENT = 'geeknative'
const GOOGLE_FONTS_REPO = 'https://raw.githubusercontent.com/google/fonts/main'
const LICENSES = [
  ['ofl', 'OFL.txt'],
  ['apache', 'LICENSE.txt'],
  ['ufl', 'UFL.txt'],
]

/**
 * Switches the project's shared typeface. A Google Fonts family is downloaded into contracts/fonts
 * (one file per weight the type scale uses), contracts/tokens.json is pointed at the files, and the
 * apps are regenerated. "system" goes back to each platform's own font.
 * @param {string} root
 * @param {string} family
 * @param {{ fetch?: typeof fetch }} [options] `fetch` is replaceable for tests
 */
export async function font(root, family, { fetch: fetchImpl = globalThis.fetch } = {}) {
  family = (family ?? '').trim()
  if (!family) {
    throw new CliError('Which family? `geeknative font "Open Sans"` downloads it from Google Fonts; `geeknative font system` uses each platform\'s own font.')
  }
  const tokensFile = path.join(root, 'contracts', 'tokens.json')
  const tokens = readJson(tokensFile, SOURCE)
  const fontsDir = path.join(root, 'contracts', 'fonts')
  const current = tokens.font ?? { family: 'system' }
  const previous = [...Object.values(current.files ?? {}), ...Object.values(current.web ?? {})].filter((f) => typeof f === 'string')
  if (typeof current.family === 'string' && current.family !== 'system') previous.push(licenseFile(current.family))

  if (family === 'system') {
    removeFiles(fontsDir, previous)
    writeFontBlock(tokensFile, { family: 'system' })
    log.ok('font', 'system: each platform uses its own font')
    gen(root)
    return
  }

  const weights = [...new Set(Object.values(tokens.typography ?? {}).map((/** @type {any} */ t) => t?.weight))]
    .filter((w) => WEIGHT_NAMES[w])
    .sort((a, b) => a - b)
  if (!weights.length) throw new CliError(`${SOURCE} has no typography styles, so there is no weight to download.`)

  log.step('font', `downloading ${family} (${weights.join(', ')}) from Google Fonts…`)
  const css = await fetchCss(fetchImpl, family, weights)
  /** @type {{ weight: number, file: string, data: Buffer, family: string }[]} */
  const downloads = []
  for (const weight of weights) {
    const url = css.match(new RegExp(`font-weight: ${weight};[^}]*?src: url\\((https:[^)]+)\\)`))?.[1]
    if (!url) {
      throw new CliError(`Google Fonts has no ${weight} weight for "${family}". See ${specimen(family)} for the weights it offers.`)
    }
    const data = Buffer.from(await (await fetchOk(fetchImpl, url)).arrayBuffer())
    const info = parseFont(data, `${family} ${weight}`)
    if (info.weight !== weight) throw new CliError(`Google Fonts sent weight ${info.weight} for ${family} ${weight}. Try again, or add the file to contracts/fonts yourself.`)
    downloads.push({ weight, file: `${stem(info.family)}-${WEIGHT_NAMES[weight]}.ttf`, data, family: info.family })
  }
  // The contract uses the name the files carry, so it always matches them.
  const name = downloads[0].family

  mkdirSync(fontsDir, { recursive: true })
  removeFiles(fontsDir, previous.filter((f) => !downloads.some((d) => d.file === f) && f !== licenseFile(name)))
  for (const { file, data } of downloads) writeFileSync(path.join(fontsDir, file), data)
  const license = await fetchLicense(fetchImpl, name)
  if (license) writeFileSync(path.join(fontsDir, licenseFile(name)), license)
  else log.warn('font', `couldn't fetch the license for ${name}; add it to contracts/fonts yourself (see ${specimen(name)}).`)

  writeFontBlock(tokensFile, { family: name, files: Object.fromEntries(downloads.map((d) => [String(d.weight), d.file])) })
  log.ok('font', `${name}: ${downloads.map((d) => d.file).join(', ')}`)
  gen(root)
}

/** "Open Sans" → "OpenSans" @param {string} family */
const stem = (family) => family.replace(/[^A-Za-z0-9]+/g, '')
/** @param {string} family */
const licenseFile = (family) => `${stem(family)}-LICENSE.txt`
/** @param {string} family */
const specimen = (family) => `https://fonts.google.com/specimen/${family.trim().replace(/\s+/g, '+')}`

/** @param {typeof fetch} fetchImpl @param {string} url @param {RequestInit} [init] */
async function fetchOk(fetchImpl, url, init) {
  const response = await fetchImpl(url, init)
  if (!response.ok) throw new CliError(`${url} answered ${response.status}.`)
  return response
}

/** @param {typeof fetch} fetchImpl @param {string} family @param {number[]} weights */
async function fetchCss(fetchImpl, family, weights) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights.join(';')}`
  const response = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT } })
  if (response.status === 400) {
    throw new CliError(
      `"${family}" is not on Google Fonts, or not with weights ${weights.join(', ')}. Check the name at https://fonts.google.com, ` +
        `or put the font's .ttf files in contracts/fonts and list them under font.files in ${SOURCE}.`,
    )
  }
  if (!response.ok) throw new CliError(`Google Fonts answered ${response.status} for ${url}.`)
  const css = await response.text()
  if (!css.includes("format('truetype')")) {
    throw new CliError(`Google Fonts didn't offer TrueType files for ${family}. Download its .ttf files from ${specimen(family)} into contracts/fonts and list them under font.files.`)
  }
  return css
}

/** The license text from the google/fonts repository, or null. @param {typeof fetch} fetchImpl @param {string} family */
async function fetchLicense(fetchImpl, family) {
  const dir = family.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const [folder, file] of LICENSES) {
    const response = await fetchImpl(`${GOOGLE_FONTS_REPO}/${folder}/${dir}/${file}`)
    if (response.ok) return `${family}, from Google Fonts (${specimen(family)}).\n\n${await response.text()}`
  }
  return null
}

/** @param {string} dir @param {string[]} files */
function removeFiles(dir, files) {
  for (const file of files) {
    const full = path.join(dir, path.basename(file))
    if (existsSync(full)) rmSync(full)
  }
}

/**
 * Replaces the top-level "font" value in tokens.json, leaving the rest of the file exactly as the
 * project formatted it.
 * @param {string} file
 * @param {unknown} block
 */
function writeFontBlock(file, block) {
  const text = readFileSync(file, 'utf8')
  const value = JSON.stringify(block, null, 2).replace(/\n/g, '\n  ')
  const span = topLevelValue(text, 'font')
  if (span) {
    writeFileSync(file, `${text.slice(0, span.start)}${value}${text.slice(span.end)}`)
    return
  }
  const close = text.lastIndexOf('}')
  const before = text.slice(0, close).trimEnd()
  writeFileSync(file, `${before}${before.endsWith('{') ? '' : ','}\n  "font": ${value}\n}\n`)
}

/**
 * Where the value of a top-level JSON property starts and ends.
 * @param {string} text
 * @param {string} key
 * @returns {{ start: number, end: number } | null}
 */
function topLevelValue(text, key) {
  const n = text.length
  /** @param {number} i */
  const string = (i) => {
    for (i++; i < n; i++) {
      if (text[i] === '\\') i++
      else if (text[i] === '"') return i + 1
    }
    return n
  }
  /** @param {number} i */
  const space = (i) => {
    while (i < n && /\s/.test(text[i])) i++
    return i
  }
  /** @param {number} i */
  const value = (i) => {
    if (text[i] === '"') return string(i)
    if (text[i] === '{' || text[i] === '[') {
      for (let depth = 0; i < n; i++) {
        if (text[i] === '"') i = string(i) - 1
        else if (text[i] === '{' || text[i] === '[') depth++
        else if ((text[i] === '}' || text[i] === ']') && --depth === 0) return i + 1
      }
      return n
    }
    while (i < n && !/[,}\]\s]/.test(text[i])) i++
    return i
  }
  let depth = 0
  for (let i = 0; i < n; i++) {
    const c = text[i]
    if (c === '"') {
      const end = string(i)
      const colon = space(end)
      if (depth === 1 && text[colon] === ':' && JSON.parse(text.slice(i, end)) === key) {
        const start = space(colon + 1)
        return { start, end: value(start) }
      }
      i = end - 1
    } else if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') depth--
  }
  return null
}
