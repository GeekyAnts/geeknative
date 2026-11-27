// @ts-check
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { templateDir } from '../lib/project.js'

const RELATIVE = 'contracts/config.json'

/**
 * Writes the template starter when the project has no contracts/config.json.
 * Leaves an existing file alone, including any values or secrets the project added.
 * @param {string} root
 * @returns {{ changed: string[], regen?: boolean }}
 */
export function seedContractsConfig(root) {
  const dest = path.join(root, RELATIVE)
  if (existsSync(dest)) return { changed: [] }
  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(path.join(templateDir(), RELATIVE), dest)
  return { changed: [RELATIVE], regen: true }
}
