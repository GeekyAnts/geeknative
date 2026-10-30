import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { parseEnv, readEnvFile } from '../src/lib/env.js'
import { CliError } from '../src/lib/log.js'
import { tempDir } from './helpers.js'

test('parseEnv reads KEY=value lines, skipping blanks and comments', () => {
  assert.deepEqual(parseEnv('# a comment\n\nMAPS_API_KEY=abc123\nOTHER=x=y\n'), { MAPS_API_KEY: 'abc123', OTHER: 'x=y' })
})

test('parseEnv accepts an export prefix and Windows line endings', () => {
  assert.deepEqual(parseEnv('export A=1\r\nB=2\r\n'), { A: '1', B: '2' })
})

test('parseEnv handles quotes', () => {
  const env = parseEnv(`DOUBLE="a \\"b\\" \\n c"\nSINGLE='no \\n escapes'\nHASH="a # b"\n`)
  assert.equal(env.DOUBLE, 'a "b" \n c')
  assert.equal(env.SINGLE, 'no \\n escapes')
  assert.equal(env.HASH, 'a # b', 'a # inside quotes is not a comment')
})

test('parseEnv drops a trailing comment on unquoted values only', () => {
  assert.deepEqual(parseEnv('A=value # note\nB=a#b\n'), { A: 'value', B: 'a#b' })
})

test('parseEnv lets a later key win', () => {
  assert.deepEqual(parseEnv('A=1\nA=2\n'), { A: '2' })
})

test('parseEnv names the line of a malformed entry', () => {
  assert.throws(
    () => parseEnv('A=1\nnot a pair\n'),
    (error) => error instanceof CliError && /\.env line 2 is not KEY=value/.test(error.message),
  )
})

test('readEnvFile returns null when there is no .env', () => {
  const dir = tempDir()
  assert.equal(readEnvFile(dir), null)
  writeFileSync(path.join(dir, '.env'), 'A=1\n')
  assert.deepEqual(readEnvFile(dir), { A: '1' })
})
