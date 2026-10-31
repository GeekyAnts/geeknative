// @ts-check
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const PLATFORMS = /** @type {const} */ (['ios', 'android', 'web'])
export const AC_ID = /AC-[a-z0-9]+(?:-[a-z0-9]+)*-\d+/g

/**
 * @typedef {{ id: string, text: string, ui: boolean }} Criterion `ui`: marked "(ui)", so only a test that drives the real UI covers it
 * @typedef {{ id: string, line: number, notOn: string[] }} TestId a test ID the spec lists, with `<placeholder>` parts for dynamic IDs; `notOn`: platforms marked "(not on iOS)" and so on, which can't use it
 * @typedef {{ id: string, title: string, file: string, status: Record<string, string>, criteria: Criterion[], testIds: TestId[] }} Feature
 */

/**
 * Reads every feature spec in spec/features (files starting with "_" are skipped).
 * @param {string} root
 * @returns {Feature[]}
 */
export function readFeatures(root) {
  const dir = path.join(root, 'spec', 'features')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((file) => {
      const text = readFileSync(path.join(dir, file), 'utf8')
      const meta = frontMatter(text)
      const id = meta.id ?? file.replace(/\.md$/, '')
      /** @type {Criterion[]} */
      const criteria = []
      for (const match of text.matchAll(/^\s*[-*]\s*\**(AC-[a-z0-9]+(?:-[a-z0-9]+)*-\d+)\**\s*(\(ui\))?\s*[:.]?\s*(.*)$/gm)) {
        if (!criteria.some((c) => c.id === match[1])) criteria.push({ id: match[1], text: match[3].trim(), ui: Boolean(match[2]) })
      }
      return { id, title: meta.title ?? id, file, status: meta.status ?? {}, criteria, testIds: readTestIds(text) }
    })
}

/**
 * The test IDs in a spec's "## Test IDs" section: every `code` span before the colon of a bullet,
 * like "- `product.<productId>.increase`, `product.<productId>.decrease`: its stepper buttons".
 * @param {string} text
 * @returns {TestId[]}
 */
function readTestIds(text) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /^##\s+Test IDs\s*$/i.test(l))
  if (start === -1) return []
  /** @type {TestId[]} */
  const ids = []
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const bullet = lines[i].match(/^\s*[-*]\s+(.*)$/)
    if (!bullet) continue
    const head = beforeColon(bullet[1])
    // "(not on iOS)" or "(not on iOS or Android)": platforms that can't use these IDs.
    const notOn = [...(head.match(/\(not on ([^)]*)\)/i)?.[1] ?? '').matchAll(/\b(ios|android|web)\b/gi)].map((m) => m[1].toLowerCase())
    for (const match of head.matchAll(/`([^`\s]+)`/g)) {
      if (/^[A-Za-z<][\w<>.-]*$/.test(match[1])) ids.push({ id: match[1], line: i + 1, notOn })
    }
  }
  return ids
}

/** A bullet's text up to its first colon outside `code`: the IDs, before their description. @param {string} text */
function beforeColon(text) {
  let code = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`') code = !code
    else if (text[i] === ':' && !code) return text.slice(0, i)
  }
  return text
}

/**
 * Reads the small YAML subset used in spec front matter: `key: value` and one level of nesting.
 * @param {string} text
 * @returns {Record<string, any>}
 */
export function frontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  /** @type {Record<string, any>} */
  const meta = {}
  if (!match) return meta
  let parent = ''
  for (const raw of match[1].split('\n')) {
    const line = raw.replace(/\s+#.*$/, '')
    const nested = line.match(/^\s+([\w-]+):\s*(.+)$/)
    const top = line.match(/^([\w-]+):\s*(.*)$/)
    if (nested && parent) meta[parent][nested[1]] = nested[2].trim()
    else if (top) {
      parent = top[2].trim() ? '' : top[1]
      meta[top[1]] = top[2].trim() || {}
    }
  }
  return meta
}
