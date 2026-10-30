// The font reader gives codegen what it needs to trust contracts/fonts: family, weight, face name.
import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import { parseFont, readFontFile } from '../src/lib/fontfile.js'
import { CliError } from '../src/lib/log.js'
import { TEMPLATE } from './helpers.js'

const fonts = path.join(TEMPLATE, 'contracts', 'fonts')

test('reads family, weight and PostScript name from the template\'s Inter files', () => {
  for (const [file, weight, name] of [
    ['Inter-Regular.ttf', 400, 'Inter-Regular'],
    ['Inter-Medium.ttf', 500, 'Inter-Medium'],
    ['Inter-SemiBold.ttf', 600, 'Inter-SemiBold'],
    ['Inter-Bold.ttf', 700, 'Inter-Bold'],
  ]) {
    assert.deepEqual(readFontFile(path.join(fonts, file), file), { family: 'Inter', postScriptName: name, weight, format: 'ttf' })
  }
})

test('rejects files that are not a single TrueType or OpenType font', () => {
  const rejects = (/** @type {Buffer} */ data, /** @type {RegExp} */ message) =>
    assert.throws(() => parseFont(data, 'contracts/fonts/x'), (e) => e instanceof CliError && message.test(e.message))
  rejects(Buffer.from('wOF2' + '\0'.repeat(40), 'latin1'), /WOFF2 web font/)
  rejects(Buffer.from('wOFF' + '\0'.repeat(40), 'latin1'), /WOFF web font/)
  rejects(Buffer.from('ttcf' + '\0'.repeat(40), 'latin1'), /font collection/)
  rejects(Buffer.from('not a font at all, just text'), /not a TrueType or OpenType font/)
  rejects(Buffer.alloc(4), /not a TrueType or OpenType font/)
})
