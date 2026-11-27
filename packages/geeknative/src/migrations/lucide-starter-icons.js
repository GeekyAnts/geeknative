// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const RELATIVE = 'contracts/icons.json'

/** Original template icons, from the per-platform triple to the Lucide form. */
const STARTER = {
  back: { icon: 'arrow-left', mirrored: true },
  home: 'house',
  settings: 'settings',
}

/**
 * Rewrites only back, home, and settings when they are still the old
 * { ios, android, web } objects. Every other icon is left alone.
 * @param {string} root
 * @returns {{ changed: string[], regen?: boolean }}
 */
export function rewriteStarterIcons(root) {
  const dest = path.join(root, RELATIVE)
  if (!existsSync(dest)) return { changed: [] }
  const raw = JSON.parse(readFileSync(dest, 'utf8'))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { changed: [] }

  let changed = false
  for (const [name, next] of Object.entries(STARTER)) {
    const value = raw[name]
    if (!isPlatformTriple(value)) continue
    raw[name] = next
    changed = true
  }
  if (!changed) return { changed: [] }
  writeFileSync(dest, `${JSON.stringify(raw, null, 2)}\n`)
  return { changed: [RELATIVE], regen: true }
}

/** @param {any} value */
function isPlatformTriple(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (value.icon !== undefined || value.svg !== undefined) return false
  return value.ios !== undefined && value.android !== undefined && value.web !== undefined
}
