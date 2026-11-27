// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { IOS_TEXT_STYLE_SIZES } from '../codegen/tokens.js'

const RELATIVE = 'contracts/tokens.json'

/**
 * With the system font, iOS sizes come from Dynamic Type. Rewrite each role's size to that
 * point size. A shared family is left alone, including a 16pt body.
 * A missing font block counts as system, matching readTokens.
 * @param {string} root
 * @returns {{ changed: string[], regen?: boolean }}
 */
export function alignSystemFontTypeSizes(root) {
  const dest = path.join(root, RELATIVE)
  if (!existsSync(dest)) return { changed: [] }
  const raw = JSON.parse(readFileSync(dest, 'utf8'))
  const family = raw?.font?.family ?? 'system'
  if (family !== 'system') return { changed: [] }
  const typography = raw?.typography
  if (!typography || typeof typography !== 'object' || Array.isArray(typography)) return { changed: [] }

  let changed = false
  for (const role of Object.values(typography)) {
    if (!role || typeof role !== 'object' || Array.isArray(role)) continue
    const expected = IOS_TEXT_STYLE_SIZES[/** @type {keyof typeof IOS_TEXT_STYLE_SIZES} */ (role.ios)]
    if (expected === undefined || role.size === expected) continue
    role.size = expected
    changed = true
  }
  if (!changed) return { changed: [] }
  writeFileSync(dest, `${JSON.stringify(raw, null, 2)}\n`)
  return { changed: [RELATIVE], regen: true }
}
