// Shared helpers for the CLI tests.
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const TEMPLATE = path.join(REPO, 'template')
export const CLI = path.join(REPO, 'packages', 'geeknative', 'bin', 'geeknative.js')

/** An empty temp folder. */
export const tempDir = () => mkdtempSync(path.join(os.tmpdir(), 'geeknative-test-'))

/**
 * A temp folder holding copies of some template folders (contracts/ by default).
 * @param {string[]} [parts]
 */
export function tempProject(parts = ['contracts']) {
  const dir = tempDir()
  for (const part of parts) cpSync(path.join(TEMPLATE, part), path.join(dir, part), { recursive: true })
  return dir
}

/** @param {string} file */
export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** @param {string} file @param {unknown} data */
export const writeJson = (file, data) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)

/**
 * Edits a JSON file in place.
 * @param {string} file
 * @param {(data: any) => void} edit
 */
export function editJson(file, edit) {
  const data = readJson(file)
  edit(data)
  writeJson(file, data)
}

/**
 * The content of the generated file whose path ends with `suffix`.
 * @param {{ path: string, content: string | Buffer }[]} outputs
 * @param {string} suffix
 */
export function outputOf(outputs, suffix) {
  const output = outputs.find((o) => o.path.endsWith(suffix))
  assert.ok(output, `no generated file ends with ${suffix}`)
  return String(output.content)
}
