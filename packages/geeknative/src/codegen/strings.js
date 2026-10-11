// @ts-check
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { banner, camelKey, docText, OUT, snakeKey, swiftString, xcodeJson } from './util.js'

const SOURCE = 'contracts/strings'
const KEY = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/
const PLACEHOLDER = /\{([a-zA-Z][a-zA-Z0-9]*)(?::(int|string))?\}/g
const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

/**
 * @typedef {{ name: string, type: 'int' | 'string' }} Placeholder
 * @typedef {string | Record<string, string>} Value
 * @typedef {{ key: string, plural: boolean, placeholders: Placeholder[], values: Record<string, Value> }} Entry
 * @typedef {{ locales: string[], defaultLocale: string, entries: Entry[] }} Strings
 * @typedef {{ path: string, content: string | Buffer }} Output
 */

/** @param {string} text @returns {Placeholder[]} */
function placeholdersIn(text) {
  /** @type {Placeholder[]} */
  const found = []
  for (const match of text.matchAll(PLACEHOLDER)) {
    const type = /** @type {'int' | 'string'} */ (match[2] ?? 'string')
    const existing = found.find((p) => p.name === match[1])
    if (existing && existing.type !== type) throw new CliError(`Placeholder {${match[1]}} is used with two types in "${text}".`)
    if (!existing) found.push({ name: match[1], type })
  }
  return found
}

/**
 * Reads contracts/strings/<locale>.json. The default locale is the source of truth;
 * other locales are translations of its keys.
 * @param {string} root
 * @param {string} defaultLocale
 * @returns {Strings}
 */
export function readStrings(root, defaultLocale) {
  const dir = path.join(root, 'contracts', 'strings')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []
  const locales = files.map((f) => f.slice(0, -5))
  if (!locales.includes(defaultLocale)) {
    throw new CliError(`${SOURCE}/${defaultLocale}.json is missing (the default locale from contracts/app.json).`)
  }
  /** @type {Record<string, Record<string, unknown>>} */
  const byLocale = {}
  for (const locale of locales) byLocale[locale] = readJson(path.join(dir, `${locale}.json`), `${SOURCE}/${locale}.json`)

  /** @type {Entry[]} */
  const entries = []
  const seen = new Map()
  for (const [key, value] of Object.entries(byLocale[defaultLocale])) {
    if (key.startsWith('$')) continue
    const where = `${SOURCE}/${defaultLocale}.json "${key}"`
    if (!KEY.test(key)) throw new CliError(`${where}: keys are dot-separated camelCase words, like "settings.appearance.title".`)
    if (key === 'app.name') throw new CliError(`${where}: the app name comes from contracts/app.json; remove this key.`)
    const id = camelKey(key)
    if (seen.has(id)) throw new CliError(`${where} collides with "${seen.get(id)}" (both become ${id}).`)
    seen.set(id, key)

    const entry = describe(key, value, where)
    entry.values[defaultLocale] = /** @type {Value} */ (value)
    for (const locale of locales) {
      if (locale === defaultLocale || byLocale[locale][key] === undefined) continue
      const translation = describe(key, byLocale[locale][key], `${SOURCE}/${locale}.json "${key}"`)
      const expected = entry.placeholders.map((p) => p.name).sort().join(',')
      const got = translation.placeholders.map((p) => p.name).sort().join(',')
      if (translation.plural !== entry.plural || expected !== got) {
        throw new CliError(`${SOURCE}/${locale}.json "${key}" must use the same placeholders and plural shape as ${defaultLocale}.json.`)
      }
      entry.values[locale] = /** @type {Value} */ (byLocale[locale][key])
    }
    entries.push(entry)
  }
  for (const locale of locales) {
    const extra = Object.keys(byLocale[locale]).filter((k) => !k.startsWith('$') && byLocale[defaultLocale][k] === undefined)
    if (extra.length) throw new CliError(`${SOURCE}/${locale}.json has keys missing from ${defaultLocale}.json: ${extra.join(', ')}.`)
  }
  entries.sort((a, b) => (a.key < b.key ? -1 : 1))
  return { locales: [defaultLocale, ...locales.filter((l) => l !== defaultLocale).sort()], defaultLocale, entries }
}

/** @param {string} key @param {unknown} value @param {string} where @returns {Entry} */
function describe(key, value, where) {
  if (typeof value === 'string') return { key, plural: false, placeholders: placeholdersIn(value), values: {} }
  if (value && typeof value === 'object') {
    const forms = Object.entries(value)
    for (const [form, text] of forms) {
      if (!PLURAL_FORMS.includes(form) || typeof text !== 'string') {
        throw new CliError(`${where}: plural strings are objects with ${PLURAL_FORMS.join('/')} keys and string values.`)
      }
      const names = placeholdersIn(text).map((p) => p.name)
      if (names.some((n) => n !== 'count')) throw new CliError(`${where}: plural strings can only use the {count} placeholder.`)
    }
    if (!('other' in value)) throw new CliError(`${where}: plural strings need an "other" form.`)
    return { key, plural: true, placeholders: [{ name: 'count', type: 'int' }], values: {} }
  }
  throw new CliError(`${where} must be a string, or a plural object like { "one": "{count} item", "other": "{count} items" }.`)
}

/** "{build:int}" → "{build}", for doc comments. @param {string} text */
const plainPlaceholders = (text) => text.replace(PLACEHOLDER, '{$1}')

/**
 * Converts "{name}" placeholders to positional printf specifiers.
 * @param {string} text
 * @param {Placeholder[]} placeholders order defines the argument positions
 * @param {{ string: string, int: string }} specifiers e.g. { string: '@', int: 'lld' }
 */
function printf(text, placeholders, specifiers) {
  if (!placeholders.length) return text
  return text.replace(/%/g, '%%').replace(PLACEHOLDER, (_, name) => {
    const index = placeholders.findIndex((p) => p.name === name)
    return `%${index + 1}$${specifiers[placeholders[index].type]}`
  })
}

/** @param {Strings} strings @param {string} appName @returns {Output[]} */
export function stringOutputs(strings, appName) {
  return [
    { path: `${OUT.iosGenerated}/Localizable.xcstrings`, content: xcstrings(strings) },
    { path: `${OUT.iosGenerated}/Strings.swift`, content: swift(strings) },
    ...strings.locales.map((locale) => ({
      path: `${OUT.androidRes}/${androidValuesDir(locale, strings.defaultLocale)}/generated_strings.xml`,
      content: androidXml(strings, locale, locale === strings.defaultLocale ? appName : null),
    })),
    { path: `${OUT.webGenerated}/strings.ts`, content: typescript(strings) },
  ]
}

// ---------- iOS ----------

const IOS_SPECIFIERS = { string: '@', int: 'lld' }

/** @param {Strings} strings */
function xcstrings(strings) {
  /** @type {Record<string, unknown>} */
  const catalog = {}
  for (const entry of strings.entries) {
    /** @type {Record<string, unknown>} */
    const localizations = {}
    for (const [locale, value] of Object.entries(entry.values)) {
      const unit = (/** @type {string} */ text) => ({
        stringUnit: { state: 'translated', value: printf(text, entry.placeholders, IOS_SPECIFIERS) },
      })
      localizations[locale] =
        typeof value === 'string'
          ? unit(value)
          : { variations: { plural: Object.fromEntries(Object.entries(value).map(([form, text]) => [form, unit(text)])) } }
    }
    catalog[entry.key] = { extractionState: 'manual', localizations }
  }
  return `${xcodeJson({ sourceLanguage: strings.defaultLocale, strings: catalog, version: '1.0' })}\n`
}

/** @param {Strings} strings */
function swift(strings) {
  const members = strings.entries.map((entry) => {
    const source = entry.values[strings.defaultLocale]
    const doc = `    /// ${docText(plainPlaceholders(typeof source === 'string' ? source : source.other))}`
    const lookup = `NSLocalizedString(${swiftString(entry.key)}, comment: "")`
    const id = camelKey(entry.key)
    if (!entry.placeholders.length) return `${doc}\n    static var ${id}: String { ${lookup} }`
    const params = entry.placeholders.map((p) => `${p.name}: ${p.type === 'int' ? 'Int' : 'String'}`).join(', ')
    const args = entry.placeholders.map((p) => p.name).join(', ')
    return `${doc}\n    static func ${id}(${params}) -> String {\n        String.localizedStringWithFormat(${lookup}, ${args})\n    }`
  })
  return `// ${banner(SOURCE)}
import Foundation

/// User-facing copy. Keys and placeholders match the Android and web apps.
nonisolated enum Strings {
${members.join('\n\n')}
}
`
}

// ---------- Android ----------

/** Android resource folder for a locale: values, values-fr, values-pt-rBR, values-b+zh+Hans. @param {string} locale @param {string} defaultLocale */
function androidValuesDir(locale, defaultLocale) {
  if (locale === defaultLocale) return 'values'
  const [language, ...rest] = locale.split('-')
  if (!rest.length) return `values-${language}`
  if (rest.length === 1 && /^[A-Z]{2}$/.test(rest[0])) return `values-${language}-r${rest[0]}`
  return `values-b+${[language, ...rest].join('+')}`
}

/** @param {string} text */
function androidEscape(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/^([@?])/, '\\$1')
}

const ANDROID_SPECIFIERS = { string: 's', int: 'd' }

/** @param {Strings} strings @param {string} locale @param {string | null} appName */
function androidXml(strings, locale, appName) {
  const lines = []
  if (appName) lines.push(`    <string name="app_name" translatable="false">${androidEscape(appName)}</string>`)
  for (const entry of strings.entries) {
    const value = entry.values[locale]
    if (value === undefined) continue
    const name = snakeKey(entry.key)
    const text = (/** @type {string} */ t) => androidEscape(printf(t, entry.placeholders, ANDROID_SPECIFIERS))
    if (typeof value === 'string') {
      const unformatted = !entry.placeholders.length && value.includes('%') ? ' formatted="false"' : ''
      lines.push(`    <string name="${name}"${unformatted}>${text(value)}</string>`)
    } else {
      lines.push(`    <plurals name="${name}">`)
      for (const [form, t] of Object.entries(value)) lines.push(`        <item quantity="${form}">${text(t)}</item>`)
      lines.push('    </plurals>')
    }
  }
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${banner(SOURCE)} -->
<resources>
${lines.join('\n')}
</resources>
`
}

// ---------- Web ----------

/** @param {Strings} strings */
function typescript(strings) {
  const hasArgs = strings.entries.some((e) => !e.plural && e.placeholders.length)
  const hasPlurals = strings.entries.some((e) => e.plural)
  const messages = strings.locales
    .map((locale) => {
      const body = strings.entries
        .filter((e) => e.values[locale] !== undefined)
        .map((e) => `    ${JSON.stringify(e.key)}: ${JSON.stringify(e.values[locale])},`)
        .join('\n')
      return `  ${JSON.stringify(locale)}: {\n${body}\n  },`
    })
    .join('\n')
  const members = strings.entries.map((entry) => {
    const source = entry.values[strings.defaultLocale]
    const doc = `  /** ${docText(plainPlaceholders(typeof source === 'string' ? source : source.other))} */`
    const id = camelKey(entry.key)
    const key = JSON.stringify(entry.key)
    if (entry.plural) return `${doc}\n  ${id}: (count: number) => plural(${key}, count),`
    if (!entry.placeholders.length) return `${doc}\n  get ${id}() {\n    return text(${key})\n  },`
    const type = entry.placeholders.map((p) => `${p.name}: ${p.type === 'int' ? 'number' : 'string'}`).join('; ')
    return `${doc}\n  ${id}: (args: { ${type} }) => text(${key}, args),`
  })

  return `// ${banner(SOURCE)}

export const locales = ${JSON.stringify(strings.locales)} as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = ${JSON.stringify(strings.defaultLocale)}

type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

const messages: Record<Locale, Record<string, string | Plural>> = {
${messages}
}

let currentLocale: Locale = defaultLocale

/** Switches the language \`strings\` returns. */
export function setLocale(locale: Locale) {
  currentLocale = locale
}

function lookup(key: string) {
  return messages[currentLocale][key] ?? messages[defaultLocale][key]
}

function text(key: string${hasArgs ? ', args: Record<string, string | number> = {}' : ''}): string {
  ${hasArgs ? 'return fill(lookup(key) as string, args)' : 'return lookup(key) as string'}
}
${
  hasArgs || hasPlurals
    ? `
function fill(template: string, args: Record<string, string | number>): string {
  return template.replace(/\\{(\\w+)(?::\\w+)?\\}/g, (_, name: string) => String(args[name]))
}
`
    : ''
}${
  hasPlurals
    ? `
function plural(key: string, count: number): string {
  const forms = lookup(key) as Plural
  return fill(forms[new Intl.PluralRules(currentLocale).select(count)] ?? forms.other, { count })
}
`
    : ''
}
/** User-facing copy. Keys and placeholders match the iOS and Android apps. */
export const strings = {
${members.join('\n')}
}
`
}
