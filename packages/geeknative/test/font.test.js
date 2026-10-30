// `geeknative font`: switching the shared typeface downloads the files and rewrites only the font block.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { font } from '../src/commands/font.js'
import { CliError } from '../src/lib/log.js'
import { editJson, readJson, TEMPLATE, tempProject } from './helpers.js'

/** @type {Record<string, string>} */
const WEIGHTS = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }
/** @param {string} name */
const inter = (name) => readFileSync(path.join(TEMPLATE, 'contracts', 'fonts', `Inter-${name}.ttf`))

/** Stands in for Google Fonts and the google/fonts repository, serving the template's Inter files. */
function fakeGoogleFonts() {
  /** @type {string[]} */
  const calls = []
  /** @type {typeof fetch} */
  const fetch = async (input, init) => {
    const url = String(input)
    calls.push(url)
    if (url.startsWith('https://fonts.googleapis.com/css2?family=Inter:wght@')) {
      assert.match(String(new Headers(init?.headers).get('user-agent')), /Windows NT 6\.1/, 'asks as a legacy browser to get TrueType files')
      const css = url
        .split('wght@')[1]
        .split(';')
        .map((w) => `@font-face {\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: ${w};\n  src: url(https://fonts.gstatic.com/s/inter/v20/${w}.ttf) format('truetype');\n}`)
        .join('\n')
      return new Response(css, { status: 200 })
    }
    if (url.startsWith('https://fonts.googleapis.com/css2')) return new Response('Missing font family', { status: 400 })
    const ttf = url.match(/\/s\/inter\/v20\/(\d+)\.ttf$/)
    if (ttf) return new Response(inter(WEIGHTS[ttf[1]]), { status: 200 })
    if (url.endsWith('/ofl/inter/OFL.txt')) return new Response('SIL OPEN FONT LICENSE Version 1.1', { status: 200 })
    return new Response('not found', { status: 404 })
  }
  return { calls, fetch }
}

/** A project on the system font with no font files, whose type scale matches Dynamic Type. */
function systemProject() {
  const dir = tempProject()
  rmSync(path.join(dir, 'contracts', 'fonts'), { recursive: true })
  const file = path.join(dir, 'contracts', 'tokens.json')
  editJson(file, (tokens) => {
    tokens.font = { family: 'system' }
    tokens.typography.body.size = 17
    tokens.typography.label.size = 15
  })
  // editJson reformats the file; put one compact line back to prove `font` leaves formatting alone.
  const text = readFileSync(file, 'utf8').replace(/"background": \{\s*"light": "#FFFFFF",\s*"dark": "#0B0D12"\s*\}/, '"background": { "light": "#FFFFFF", "dark": "#0B0D12" }')
  writeFileSync(file, text)
  return dir
}

test('downloads one file per weight the type scale uses and points the contract at them', async () => {
  const dir = systemProject()
  const google = fakeGoogleFonts()
  await font(dir, 'Inter', { fetch: google.fetch })

  assert.ok(google.calls[0].endsWith('family=Inter:wght@400;500;600;700'), google.calls[0])
  const fonts = path.join(dir, 'contracts', 'fonts')
  for (const name of Object.values(WEIGHTS)) {
    assert.ok(readFileSync(path.join(fonts, `Inter-${name}.ttf`)).equals(inter(name)), `Inter-${name}.ttf`)
  }
  assert.match(readFileSync(path.join(fonts, 'Inter-LICENSE.txt'), 'utf8'), /^Inter, from Google Fonts[\s\S]*SIL OPEN FONT LICENSE/)

  const text = readFileSync(path.join(dir, 'contracts', 'tokens.json'), 'utf8')
  assert.deepEqual(JSON.parse(text).font, {
    family: 'Inter',
    files: { 400: 'Inter-Regular.ttf', 500: 'Inter-Medium.ttf', 600: 'Inter-SemiBold.ttf', 700: 'Inter-Bold.ttf' },
  })
  assert.match(text, /"background": \{ "light": "#FFFFFF", "dark": "#0B0D12" \}/, 'the rest of the file keeps its formatting')
  assert.equal(JSON.parse(text).typography.body.size, 17, 'the rest of the file is untouched')
  assert.match(readFileSync(path.join(dir, 'apps', 'ios', 'App', 'Generated', 'Tokens.swift'), 'utf8'), /Inter-SemiBold/, 'the apps were regenerated')
})

test('adds the font block when tokens.json has none', async () => {
  const dir = systemProject()
  editJson(path.join(dir, 'contracts', 'tokens.json'), (tokens) => delete tokens.font)
  await font(dir, 'Inter', { fetch: fakeGoogleFonts().fetch })
  assert.equal(readJson(path.join(dir, 'contracts', 'tokens.json')).font.family, 'Inter')
})

test('system removes the downloaded files and goes back to each platform\'s own font', async () => {
  const dir = tempProject() // the template: Inter, with its files
  editJson(path.join(dir, 'contracts', 'tokens.json'), (tokens) => {
    tokens.typography.body.size = 17
    tokens.typography.label.size = 15
  })
  await font(dir, 'system', { fetch: fakeGoogleFonts().fetch })
  const fonts = path.join(dir, 'contracts', 'fonts')
  assert.ok(!existsSync(path.join(fonts, 'Inter-Regular.ttf')))
  assert.ok(!existsSync(path.join(fonts, 'Inter-LICENSE.txt')))
  assert.deepEqual(readJson(path.join(dir, 'contracts', 'tokens.json')).font, { family: 'system' })
  assert.match(readFileSync(path.join(dir, 'apps', 'ios', 'App', 'Generated', 'Tokens.swift'), 'utf8'), /\.title3\.weight\(\.semibold\)/)
})

test('a family Google Fonts does not have fails and points at the manual route', async () => {
  await assert.rejects(
    font(systemProject(), 'Not A Font', { fetch: fakeGoogleFonts().fetch }),
    (e) => e instanceof CliError && /"Not A Font" is not on Google Fonts[\s\S]*list them under font\.files/.test(e.message),
  )
  await assert.rejects(font(systemProject(), '', { fetch: fakeGoogleFonts().fetch }), (e) => e instanceof CliError && /Which family\?/.test(e.message))
})
