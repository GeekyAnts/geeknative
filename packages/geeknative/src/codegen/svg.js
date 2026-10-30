// @ts-check
// Icon geometry shared by every platform. An icon starts as a list of SVG shape nodes (the form
// Lucide publishes, or parsed from an SVG file in contracts/icons) and becomes plain paths that
// each platform draws: an SVG for the Xcode asset catalog, a vector drawable for Android, JSX for
// the web. Only simple single-color icons are supported: no gradients, masks, text or transforms.
import { CliError } from '../lib/log.js'

/**
 * @typedef {[string, Record<string, string>]} Node
 * @typedef {{ d: string, fill: boolean, stroke: boolean }} IconPath fill/stroke say whether the app's color paints them
 * @typedef {{ size: number, strokeWidth: number, paths: IconPath[] }} Shape `size` is the square viewBox
 */

const SHAPES = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])
/** Tags that carry no geometry and can be skipped. */
const IGNORED = new Set(['title', 'desc', 'metadata'])

/** @param {number} n */
function num(n) {
  const rounded = Math.round(n * 1000) / 1000
  return String(rounded === 0 ? 0 : rounded)
}

/** @param {Record<string, string>} attrs @param {string} name @param {string} where @param {number} [fallback] */
function number(attrs, name, where, fallback) {
  const raw = attrs[name]
  if (raw === undefined) {
    if (fallback !== undefined) return fallback
    throw new CliError(`${where} <${attrs.$tag}> needs a "${name}" attribute.`)
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new CliError(`${where} <${attrs.$tag}> has a "${name}" that is not a number: "${raw}".`)
  return value
}

/** Paint attributes a shape inherits from its parents. @typedef {{ fill: boolean, stroke: boolean }} Paint */

/**
 * Turns one shape element into path data.
 * @param {string} tag
 * @param {Record<string, string>} attrs
 * @param {string} where
 * @returns {string}
 */
export function toPathData(tag, attrs, where) {
  attrs = { ...attrs, $tag: tag }
  switch (tag) {
    case 'path': {
      if (!attrs.d?.trim()) throw new CliError(`${where} <path> needs a "d" attribute.`)
      return attrs.d.trim().replace(/\s+/g, ' ')
    }
    case 'circle':
    case 'ellipse': {
      const cx = number(attrs, 'cx', where, 0)
      const cy = number(attrs, 'cy', where, 0)
      const rx = tag === 'circle' ? number(attrs, 'r', where) : number(attrs, 'rx', where)
      const ry = tag === 'circle' ? rx : number(attrs, 'ry', where)
      return `M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(2 * rx)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-2 * rx)} 0`
    }
    case 'rect': {
      const x = number(attrs, 'x', where, 0)
      const y = number(attrs, 'y', where, 0)
      const w = number(attrs, 'width', where)
      const h = number(attrs, 'height', where)
      let rx = attrs.rx !== undefined ? number(attrs, 'rx', where) : attrs.ry !== undefined ? number(attrs, 'ry', where) : 0
      let ry = attrs.ry !== undefined ? number(attrs, 'ry', where) : rx
      rx = Math.min(rx, w / 2)
      ry = Math.min(ry, h / 2)
      if (rx <= 0 || ry <= 0) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`
      const arc = (/** @type {number} */ dx, /** @type {number} */ dy) => `a${num(rx)} ${num(ry)} 0 0 1 ${num(dx)} ${num(dy)}`
      return (
        `M${num(x + rx)} ${num(y)}h${num(w - 2 * rx)}${arc(rx, ry)}v${num(h - 2 * ry)}${arc(-rx, ry)}` +
        `h${num(-(w - 2 * rx))}${arc(-rx, -ry)}v${num(-(h - 2 * ry))}${arc(rx, -ry)}z`
      )
    }
    case 'line': {
      const x1 = number(attrs, 'x1', where, 0)
      const y1 = number(attrs, 'y1', where, 0)
      const x2 = number(attrs, 'x2', where, 0)
      const y2 = number(attrs, 'y2', where, 0)
      return `M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}`
    }
    case 'polyline':
    case 'polygon': {
      const values = (attrs.points ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number)
      if (values.length < 4 || values.length % 2 || values.some((v) => !Number.isFinite(v))) {
        throw new CliError(`${where} <${tag}> needs "points" with at least two x,y pairs.`)
      }
      const pairs = []
      for (let i = 0; i < values.length; i += 2) pairs.push(`${num(values[i])} ${num(values[i + 1])}`)
      return `M${pairs.join('L')}${tag === 'polygon' ? 'z' : ''}`
    }
    default:
      throw new CliError(`${where} <${tag}> isn't supported. Icons can use path, circle, ellipse, rect, line, polyline and polygon.`)
  }
}

/**
 * Paint for one element: an explicit fill/stroke overrides what it inherits.
 * @param {Record<string, string>} attrs
 * @param {Paint} inherited
 * @returns {Paint}
 */
function paint(attrs, inherited) {
  const painted = (/** @type {string | undefined} */ value, /** @type {boolean} */ fallback) =>
    value === undefined ? fallback : value.trim() !== 'none'
  return { fill: painted(attrs.fill, inherited.fill), stroke: painted(attrs.stroke, inherited.stroke) }
}

/**
 * The shape of a catalog icon: Lucide's nodes on its 24-unit grid, stroked with the family's width.
 * @param {Node[]} nodes
 * @param {{ size: number, strokeWidth: number }} family
 * @param {string} where
 * @returns {Shape}
 */
export function shapeFromNodes(nodes, family, where) {
  const base = { fill: false, stroke: true }
  const paths = nodes.map(([tag, attrs]) => ({ d: toPathData(tag, attrs, where), ...paint(attrs, base) }))
  return { size: family.size, strokeWidth: family.strokeWidth, paths }
}

const TAG = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g
const ATTR = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * Reads a simple SVG file (like Lucide's, or an exported single-color logo) into a shape.
 * @param {string} text
 * @param {string} where
 * @param {{ strokeWidth: number }} family the stroke width every icon in the project uses
 * @returns {Shape}
 */
export function shapeFromSvg(text, where, family) {
  /** @type {Shape['paths']} */
  const paths = []
  /** @type {{ tag: string, paint: Paint }[]} */
  const stack = []
  let size = 0
  let skipping = ''
  TAG.lastIndex = 0
  for (let match = TAG.exec(text); match; match = TAG.exec(text)) {
    const [token, tag, rawAttrs, selfClosing] = match
    if (!tag) continue // comment, prolog or doctype
    const closing = token.startsWith('</')
    if (skipping) {
      if (closing && tag === skipping) skipping = ''
      continue
    }
    if (closing) {
      if (stack.length && stack[stack.length - 1].tag === tag) stack.pop()
      continue
    }
    /** @type {Record<string, string>} */
    const attrs = {}
    for (const a of rawAttrs.matchAll(ATTR)) attrs[a[1]] = a[2] ?? a[3] ?? ''
    if (attrs.transform !== undefined) {
      throw new CliError(`${where} <${tag}> has a transform. Flatten transforms before using an SVG as an icon.`)
    }
    if (attrs.style !== undefined) throw new CliError(`${where} <${tag}> uses a style attribute. Use plain fill/stroke attributes instead.`)
    const inherited = stack.length ? stack[stack.length - 1].paint : { fill: true, stroke: false }

    if (tag === 'svg') {
      if (stack.length) throw new CliError(`${where} has a nested <svg>.`)
      const box = (attrs.viewBox ?? '').trim().split(/[\s,]+/).map(Number)
      if (box.length !== 4 || box.some((v) => !Number.isFinite(v))) {
        throw new CliError(`${where} needs a viewBox like "0 0 24 24" on its <svg>.`)
      }
      if (box[0] !== 0 || box[1] !== 0 || box[2] !== box[3] || box[2] <= 0) {
        throw new CliError(`${where} must have a square viewBox starting at 0 0 (like "0 0 24 24"), got "${attrs.viewBox}".`)
      }
      size = box[2]
      stack.push({ tag, paint: paint(attrs, inherited) })
      if (selfClosing) stack.pop()
      continue
    }
    if (!size) throw new CliError(`${where} doesn't start with an <svg> element.`)
    if (IGNORED.has(tag)) {
      if (!selfClosing) skipping = tag
      continue
    }
    if (tag === 'g') {
      stack.push({ tag, paint: paint(attrs, inherited) })
      if (selfClosing) stack.pop()
      continue
    }
    if (!SHAPES.has(tag)) {
      throw new CliError(`${where} uses <${tag}>, which icons can't contain. Keep icons to path, circle, ellipse, rect, line, polyline and polygon in one color.`)
    }
    paths.push({ d: toPathData(tag, attrs, where), ...paint(attrs, inherited) })
    if (!selfClosing) stack.push({ tag, paint: inherited })
  }
  if (!size) throw new CliError(`${where} doesn't contain an <svg> element.`)
  if (!paths.length) throw new CliError(`${where} has no shapes to draw.`)
  return { size, strokeWidth: family.strokeWidth, paths }
}

/** Attributes a path needs beyond the icon's defaults (stroke on, fill off). @param {IconPath} p @param {string} color */
function overrides(p, color) {
  return `${p.fill ? ` fill="${color}"` : ''}${p.stroke ? '' : ' stroke="none"'}`
}

/**
 * A normalized SVG document, used for the Xcode asset catalog (which renders it as a template image).
 * @param {Shape} shape
 */
export function svgDocument(shape) {
  const black = '#000000'
  const body = shape.paths.map((p) => `  <path d="${p.d}"${overrides(p, black)}/>`).join('\n')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.size}" height="${shape.size}" viewBox="0 0 ${shape.size} ${shape.size}"` +
    ` fill="none" stroke="${black}" stroke-width="${num(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round">\n${body}\n</svg>\n`
  )
}

/**
 * JSX children for the web component, one <path> per shape.
 * @param {Shape} shape
 * @param {string} indent
 */
export function jsxPaths(shape, indent) {
  return shape.paths.map((p) => `${indent}<path d="${p.d}"${overrides(p, 'currentColor')} />`).join('\n')
}

/**
 * An Android vector drawable. Paths are black; `Icon()` tints them with the content color.
 * @param {Shape} shape
 * @param {{ mirrored: boolean, banner: string }} options
 */
export function vectorDrawable(shape, { mirrored, banner }) {
  const paths = shape.paths
    .map((p) => {
      const stroke = p.stroke
        ? ` android:strokeColor="#FF000000" android:strokeWidth="${num(shape.strokeWidth)}" android:strokeLineCap="round" android:strokeLineJoin="round"`
        : ''
      return `    <path android:pathData="${p.d}" android:fillColor="${p.fill ? '#FF000000' : '#00000000'}"${stroke} />`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${banner} -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${shape.size}dp"
    android:height="${shape.size}dp"
    android:viewportWidth="${shape.size}"
    android:viewportHeight="${shape.size}"${mirrored ? '\n    android:autoMirrored="true"' : ''}>
${paths}
</vector>
`
}
