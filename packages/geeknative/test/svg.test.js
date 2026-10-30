// Icon geometry: every shape becomes a path that each platform can draw the same way.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { jsxPaths, shapeFromNodes, shapeFromSvg, svgDocument, toPathData, vectorDrawable } from '../src/codegen/svg.js'
import { CliError } from '../src/lib/log.js'

const where = 'contracts/icons/test.svg'
const lucide = { size: 24, strokeWidth: 2 }

test('shapes become path data', () => {
  assert.equal(toPathData('circle', { cx: '12', cy: '12', r: '3' }, where), 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0')
  assert.equal(toPathData('ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }, where), 'M3 5a9 3 0 1 0 18 0a9 3 0 1 0 -18 0')
  assert.equal(toPathData('rect', { x: '3', y: '3', width: '18', height: '18' }, where), 'M3 3h18v18h-18z')
  assert.equal(
    toPathData('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }, where),
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z',
  )
  assert.equal(toPathData('line', { x1: '4', y1: '4', x2: '20', y2: '20' }, where), 'M4 4L20 20')
  assert.equal(toPathData('polyline', { points: '4 4, 12 20, 20 4' }, where), 'M4 4L12 20L20 4')
  assert.equal(toPathData('polygon', { points: '4,4 12,20 20,4' }, where), 'M4 4L12 20L20 4z')
  assert.equal(toPathData('path', { d: 'M 1 2   L 3 4' }, where), 'M 1 2 L 3 4')
})

test('a rounded rect clamps each radius to its own side, as SVG does', () => {
  // ry defaults to rx, then rx is limited to half the width and ry to half the height.
  assert.equal(toPathData('rect', { width: '4', height: '10', rx: '9' }, where), 'M2 0h0a2 5 0 0 1 2 5v0a2 5 0 0 1 -2 5h0a2 5 0 0 1 -2 -5v0a2 5 0 0 1 2 -5z')
})

test('catalog nodes keep Lucide defaults: stroked, not filled, unless a node says otherwise', () => {
  const shape = shapeFromNodes([['path', { d: 'M1 1h2' }], ['circle', { cx: '12', cy: '12', r: '2', fill: 'currentColor' }]], lucide, where)
  assert.equal(shape.size, 24)
  assert.equal(shape.strokeWidth, 2)
  assert.deepEqual(shape.paths.map((p) => [p.fill, p.stroke]), [[false, true], [true, true]])
})

test('a Lucide-style SVG file parses into the same shape', () => {
  const svg = `<!-- @license lucide-static v1.55.0 - ISC -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <title>Settings</title>
  <path d="M9 4h6" />
  <circle cx="12" cy="12" r="3" />
</svg>`
  const shape = shapeFromSvg(svg, where, { strokeWidth: 2 })
  assert.equal(shape.size, 24)
  assert.deepEqual(shape.paths, [
    { d: 'M9 4h6', fill: false, stroke: true },
    { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', fill: false, stroke: true },
  ])
})

test('a filled logo keeps its fill, and groups pass paint down', () => {
  const svg = `<?xml version="1.0"?>
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <g fill="#CA0515"><rect width="48" height="48"/></g>
  <path d="M0 0h1" fill="none" stroke="#000"/>
</svg>`
  const shape = shapeFromSvg(svg, where, { strokeWidth: 2 })
  assert.equal(shape.size, 48)
  assert.deepEqual(shape.paths.map((p) => [p.fill, p.stroke]), [[true, false], [false, true]])
})

test('unsupported SVG features fail with a reason', () => {
  const rejects = (/** @type {string} */ svg, /** @type {RegExp} */ message) =>
    assert.throws(() => shapeFromSvg(svg, where, { strokeWidth: 2 }), (e) => e instanceof CliError && message.test(e.message))
  rejects('<svg viewBox="0 0 24 24"><defs/><path d="M0 0h1"/></svg>', /uses <defs>/)
  rejects('<svg viewBox="0 0 24 24"><path d="M0 0h1" transform="rotate(45)"/></svg>', /has a transform/)
  rejects('<svg viewBox="0 0 24 24"><path d="M0 0h1" style="fill:red"/></svg>', /style attribute/)
  rejects('<svg viewBox="0 0 24 12"><path d="M0 0h1"/></svg>', /square viewBox/)
  rejects('<svg width="24"><path d="M0 0h1"/></svg>', /needs a viewBox/)
  rejects('<svg viewBox="0 0 24 24"><text>Hi</text></svg>', /uses <text>/)
  rejects('<svg viewBox="0 0 24 24"></svg>', /no shapes/)
  rejects('<svg viewBox="0 0 24 24"><polyline points="1 2 3"/></svg>', /at least two x,y pairs/)
})

test('renderers draw the same paths for Xcode, Android and the web', () => {
  const shape = shapeFromNodes([['path', { d: 'M9 4h6' }], ['circle', { cx: '12', cy: '12', r: '3', fill: 'currentColor', stroke: 'none' }]], lucide, where)

  const svg = svgDocument(shape)
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2"/)
  assert.match(svg, /<path d="M9 4h6"\/>\n  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="#000000" stroke="none"\/>/)

  const xml = vectorDrawable(shape, { mirrored: true, banner: 'GENERATED' })
  assert.match(xml, /android:viewportWidth="24"/)
  assert.match(xml, /android:autoMirrored="true"/)
  assert.match(xml, /<path android:pathData="M9 4h6" android:fillColor="#00000000" android:strokeColor="#FF000000" android:strokeWidth="2" android:strokeLineCap="round" android:strokeLineJoin="round" \/>/)
  assert.match(xml, /<path android:pathData="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" android:fillColor="#FF000000" \/>/)
  assert.doesNotMatch(vectorDrawable(shape, { mirrored: false, banner: 'GENERATED' }), /autoMirrored/)

  assert.equal(jsxPaths(shape, '      '), '      <path d="M9 4h6" />\n      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="currentColor" stroke="none" />')
})
