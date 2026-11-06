// @ts-check
// Reads the few facts geeknative needs from a TrueType or OpenType font file: its family name,
// weight and PostScript name. Enough to check contracts/fonts against the contract and to name
// faces in generated code, without a font library.
import { readFileSync } from 'node:fs'
import { CliError } from './log.js'

/** @typedef {{ family: string, postScriptName: string, weight: number, format: 'ttf' | 'otf' }} FontInfo */

/** @param {string} file @param {string} where how to name the file in errors @returns {FontInfo} */
export function readFontFile(file, where) {
  return parseFont(readFileSync(file), where)
}

/** @param {Buffer} data @param {string} where @returns {FontInfo} */
export function parseFont(data, where) {
  if (data.length < 12) throw new CliError(`${where} is not a TrueType or OpenType font.`)
  const tag = data.toString('latin1', 0, 4)
  if (tag === 'wOFF' || tag === 'wOF2') {
    throw new CliError(`${where} is a ${tag === 'wOFF' ? 'WOFF' : 'WOFF2'} web font. iOS and Android need the TrueType or OpenType file (.ttf or .otf).`)
  }
  if (tag === 'ttcf') throw new CliError(`${where} is a font collection. Use a file that holds one font.`)
  const format = tag === 'OTTO' ? 'otf' : data.readUInt32BE(0) === 0x00010000 || tag === 'true' ? 'ttf' : null
  if (!format) throw new CliError(`${where} is not a TrueType or OpenType font.`)

  /** @type {Record<string, { offset: number, length: number }>} */
  const tables = {}
  const count = data.readUInt16BE(4)
  for (let i = 0; i < count; i++) {
    const record = 12 + i * 16
    if (record + 16 > data.length) break
    tables[data.toString('latin1', record, record + 4)] = { offset: data.readUInt32BE(record + 8), length: data.readUInt32BE(record + 12) }
  }
  const os2 = tables['OS/2']
  if (!tables.name || !os2 || os2.offset + 6 > data.length) throw new CliError(`${where} is missing its name or OS/2 table.`)

  const names = readNames(data, tables.name.offset)
  const family = names.get(16) ?? names.get(1)
  const postScriptName = names.get(6)
  if (!family || !postScriptName) throw new CliError(`${where} has no family or PostScript name.`)
  return { family, postScriptName, weight: data.readUInt16BE(os2.offset + 4), format }
}

/**
 * The name table, preferring English Windows entries, then Unicode, then Macintosh Roman.
 * @param {Buffer} data
 * @param {number} base
 * @returns {Map<number, string>}
 */
function readNames(data, base) {
  const count = data.readUInt16BE(base + 2)
  const strings = base + data.readUInt16BE(base + 4)
  /** @type {Map<number, { score: number, text: string }>} */
  const best = new Map()
  for (let i = 0; i < count; i++) {
    const record = base + 6 + i * 12
    const platform = data.readUInt16BE(record)
    const encoding = data.readUInt16BE(record + 2)
    const language = data.readUInt16BE(record + 4)
    const nameId = data.readUInt16BE(record + 6)
    const length = data.readUInt16BE(record + 8)
    const start = strings + data.readUInt16BE(record + 10)
    if (start + length > data.length) continue
    let text
    let score
    if (platform === 3 && (encoding === 1 || encoding === 10)) {
      text = utf16be(data, start, length)
      score = language === 0x409 ? 3 : 2
    } else if (platform === 0) {
      text = utf16be(data, start, length)
      score = 1
    } else if (platform === 1 && encoding === 0) {
      text = data.toString('latin1', start, start + length)
      score = language === 0 ? 1 : 0
    } else continue
    const current = best.get(nameId)
    if (!current || score > current.score) best.set(nameId, { score, text })
  }
  return new Map([...best].map(([id, { text }]) => [id, text]))
}

/** @param {Buffer} data @param {number} start @param {number} length */
function utf16be(data, start, length) {
  const swapped = Buffer.from(data.subarray(start, start + length - (length % 2)))
  return swapped.swap16().toString('utf16le')
}
