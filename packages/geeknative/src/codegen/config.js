// @ts-check
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, docText, kotlinString, OUT, snakeKey, swiftString } from './util.js'

const SOURCE = 'contracts/config.json'
const TOP_LEVEL_KEYS = ['environments', 'values', 'secrets']
const VALUE_TYPES = ['string', 'url', 'boolean', 'int']

/**
 * @typedef {'string' | 'url' | 'boolean' | 'int'} ValueType
 * @typedef {{ type: ValueType, description?: string, perEnv: Record<string, string | boolean | number> }} ConfigValue
 * @typedef {{ description?: string, envKey: string }} ConfigSecret
 * @typedef {{ environments: string[], values: Record<string, ConfigValue>, secrets: Record<string, ConfigSecret> }} Config
 * @typedef {{ path: string, content: string | Buffer, local?: boolean }} Output `local` files come from .env, are
 * gitignored, and are written by `gen` but never compared against what's on disk.
 */

/** "mapsApiKey" → "MAPS_API_KEY": the name of a secret in .env. @param {string} name */
export const envKey = (name) => snakeKey(name).toUpperCase()

/** @param {string} root @returns {Config} */
export function readConfig(root) {
  const file = path.join(root, 'contracts', 'config.json')
  // A specific hint beats the generic "is missing" from readJson: projects made before config.json existed hit this.
  if (!existsSync(file)) {
    throw new CliError(
      `${SOURCE} is missing. Create it with {"environments": ["development", "staging", "production"], "values": {}, "secrets": {}}.`,
    )
  }
  return validateConfig(readJson(file, SOURCE))
}

/**
 * Checks contracts/config.json and returns it in a normalized shape.
 * Throws a CliError naming the file and field of the first problem.
 * @param {any} raw
 * @returns {Config}
 */
export function validateConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CliError(`${SOURCE} must be an object with "environments", "values" and "secrets".`)
  }
  for (const key of Object.keys(raw)) {
    if (key.startsWith('$') || TOP_LEVEL_KEYS.includes(key)) continue
    throw new CliError(`${SOURCE} has an unknown key "${key}". Use "environments", "values" and "secrets".`)
  }

  const environments = readEnvironments(raw.environments)
  return { environments, values: readValues(raw.values ?? {}, environments), secrets: readSecrets(raw.secrets ?? {}) }
}

/** @param {unknown} list @returns {string[]} */
function readEnvironments(list) {
  if (!Array.isArray(list) || list.length === 0 || list.some((name) => typeof name !== 'string')) {
    throw new CliError(`${SOURCE} "environments" must be a list of names like ["development", "staging", "production"].`)
  }
  const seen = new Set()
  for (const name of list) {
    assertIdentifier(name, `${SOURCE} environment`)
    if (seen.has(name)) throw new CliError(`${SOURCE} "environments" lists "${name}" twice.`)
    seen.add(name)
  }
  // Debug builds default to development and release builds to production, so both must exist.
  if (!seen.has('development') || !seen.has('production')) {
    throw new CliError(`${SOURCE} "environments" must include "development" and "production" (the defaults for debug and release builds).`)
  }
  return list
}

/** @param {any} group @param {string[]} environments @returns {Record<string, ConfigValue>} */
function readValues(group, environments) {
  if (typeof group !== 'object' || Array.isArray(group)) {
    throw new CliError(`${SOURCE} "values" must be an object of named settings.`)
  }
  /** @type {Record<string, ConfigValue>} */
  const values = {}
  for (const [name, entry] of Object.entries(group)) {
    if (name.startsWith('$')) continue
    assertIdentifier(name, `${SOURCE} value`)
    const where = `${SOURCE} values.${name}`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new CliError(`${where} must be an object with "type" and a value for every environment.`)
    }
    const { type, description } = /** @type {any} */ (entry)
    if (!VALUE_TYPES.includes(type)) throw new CliError(`${where} "type" must be "string", "url", "boolean" or "int".`)
    if (description !== undefined && typeof description !== 'string') throw new CliError(`${where} "description" must be text.`)

    // Every key besides type, description and comments must be a declared environment.
    for (const key of Object.keys(entry)) {
      if (key === 'type' || key === 'description' || key.startsWith('$') || environments.includes(key)) continue
      throw new CliError(`${where} has "${key}", which isn't in "environments".`)
    }
    /** @type {Record<string, string | boolean | number>} */
    const perEnv = {}
    for (const env of environments) {
      const value = /** @type {any} */ (entry)[env]
      // No fallback between environments: a missing value is a mistake worth surfacing.
      if (value === undefined) throw new CliError(`${where} is missing a value for "${env}". Every value needs every environment.`)
      perEnv[env] = checkValue(type, value, `${where}.${env}`)
    }
    values[name] = { type, description, perEnv }
  }
  return values
}

/** @param {ValueType} type @param {unknown} value @param {string} where */
function checkValue(type, value, where) {
  if (type === 'boolean') {
    if (typeof value !== 'boolean') throw new CliError(`${where} must be true or false.`)
  } else if (type === 'int') {
    if (!Number.isInteger(value)) throw new CliError(`${where} must be a whole number.`)
  } else if (typeof value !== 'string') {
    throw new CliError(`${where} must be a string.`)
  } else if (type === 'url' && (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || !URL.canParse(value) || /\s/.test(value))) {
    // The scheme check matters: URL.canParse("localhost:8080") is true because it reads "localhost:" as a scheme.
    throw new CliError(`${where} must be an absolute URL like "https://api.example.com" (got ${JSON.stringify(value)}).`)
  }
  return /** @type {string | boolean | number} */ (value)
}

/** @param {any} group @returns {Record<string, ConfigSecret>} */
function readSecrets(group) {
  if (typeof group !== 'object' || Array.isArray(group)) {
    throw new CliError(`${SOURCE} "secrets" must be an object of named secrets.`)
  }
  /** @type {Record<string, ConfigSecret>} */
  const secrets = {}
  /** @type {Map<string, string>} .env key → secret name, to catch two names that collide */
  const keys = new Map()
  for (const [name, entry] of Object.entries(group)) {
    if (name.startsWith('$')) continue
    assertIdentifier(name, `${SOURCE} secret`)
    const where = `${SOURCE} secrets.${name}`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new CliError(`${where} must be an object like { "type": "string" }.`)
    if (/** @type {any} */ (entry).type !== 'string') throw new CliError(`${where} "type" must be "string".`)
    const description = /** @type {any} */ (entry).description
    if (description !== undefined && typeof description !== 'string') throw new CliError(`${where} "description" must be text.`)

    const key = envKey(name)
    for (const field of Object.keys(entry)) {
      if (field === 'type' || field === 'description' || field.startsWith('$')) continue
      // The most likely mistake: pasting the secret itself into the contract, which is committed.
      throw new CliError(`${where} has "${field}". Secrets are names only: put the value in .env as ${key}.`)
    }
    if (keys.has(key)) throw new CliError(`${SOURCE} secrets "${keys.get(key)}" and "${name}" both map to the .env key ${key}.`)
    keys.set(key, name)
    secrets[name] = { description, envKey: key }
  }
  return secrets
}

// ---------- Generated code ----------

/** Value names sorted, so output doesn't depend on the order in the contract. @param {Config} config */
const sortedValues = (config) => Object.entries(config.values).sort(([a], [b]) => (a < b ? -1 : 1))

/**
 * Looks up each declared secret in .env. A missing one becomes an empty string (so the apps still
 * compile on a fresh clone) plus a warning.
 * @param {Config} config
 * @param {Record<string, string> | null} env the parsed .env, or null when there is none
 * @returns {{ values: Record<string, string>, warnings: string[] }}
 */
export function resolveSecrets(config, env) {
  /** @type {Record<string, string>} */
  const values = {}
  /** @type {string[]} */
  const missing = []
  for (const [name, { envKey: key }] of Object.entries(config.secrets)) {
    values[name] = env?.[key] ?? ''
    if (!values[name]) missing.push(key)
  }
  if (!missing.length) return { values, warnings: [] }
  const empty = `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} empty in AppSecrets`
  return {
    values,
    warnings: [env ? `.env lacks ${missing.join(', ')}: ${empty}.` : `.env is missing: ${empty}. Copy .env.example to .env and fill it in.`],
  }
}

/**
 * @param {Config} config
 * @param {Record<string, string>} [secretValues] by secret name, from resolveSecrets
 * @returns {Output[]}
 */
export function configOutputs(config, secretValues = {}) {
  /** @type {Output[]} */
  const outputs = [
    { path: `${OUT.iosGenerated}/AppConfig.swift`, content: swift(config) },
    { path: `${OUT.androidKotlin}/AppConfig.kt`, content: kotlin(config) },
    { path: `${OUT.webGenerated}/config.ts`, content: typescript(config) },
  ]
  if (!Object.keys(config.secrets).length) return outputs // nothing declared, so no secret files at all
  return [
    ...outputs,
    // Mobile apps embed the values, so these two files hold real secrets and must stay out of git.
    { path: `${OUT.iosGenerated}/AppSecrets.swift`, content: swiftSecrets(config, secretValues), local: true },
    { path: `${OUT.androidKotlin}/AppSecrets.kt`, content: kotlinSecrets(config, secretValues), local: true },
    // The web side only names the keys and reads process.env on the server, so it is safe to commit.
    { path: `${OUT.webGenerated}/secrets.server.ts`, content: typescriptSecrets(config) },
    { path: ENV_EXAMPLE, content: envExample(config) },
  ]
}

/** The committed template for .env, listing every declared secret. */
export const ENV_EXAMPLE = '.env.example'

/** @param {Config} config */
function swift(config) {
  const cases = config.environments.map((env) => `    case ${env}`).join('\n')
  const conditions = config.environments
    .map((env, i) => `        #${i === 0 ? 'if' : 'elseif'} APP_ENV_${env}\n        return .${env}`)
    .join('\n')
  const swiftTypes = { string: 'String', url: 'URL', boolean: 'Bool', int: 'Int' }
  const literal = (/** @type {ConfigValue} */ v, /** @type {string | boolean | number} */ x) =>
    v.type === 'url' ? `URL(string: ${swiftString(String(x))})!` : v.type === 'string' ? swiftString(String(x)) : String(x)
  const members = sortedValues(config).map(([name, v]) => {
    const rows = config.environments.map((env) => `        case .${env}: return ${literal(v, v.perEnv[env])}`).join('\n')
    const doc = v.description ? `    /// ${docText(v.description)}\n` : ''
    return `${doc}    static let ${name}: ${swiftTypes[v.type]} = {\n        switch AppEnvironment.current {\n${rows}\n        }\n    }()`
  })
  return `// ${banner(SOURCE)}
import Foundation

/// The environments this app can be built for. The active one is APP_ENVIRONMENT in Config/Debug.xcconfig
/// (development) and Config/Release.xcconfig (production). Override it with \`xcodebuild APP_ENVIRONMENT=staging\`.
nonisolated enum AppEnvironment: String, CaseIterable {
${cases}

    /// The environment this build was made for.
    static let current: AppEnvironment = {
${conditions}
        #else
        #error("APP_ENVIRONMENT must be one of: ${config.environments.join(', ')}. See Config/Debug.xcconfig and Config/Release.xcconfig.")
        #endif
    }()
}

/// Settings that differ per environment, shared with the Android and web apps.
nonisolated enum AppConfig {${members.length ? `\n${members.join('\n\n')}\n` : ''}}
`
}

/** @param {Config} config */
function kotlin(config) {
  const constant = (/** @type {string} */ env) => snakeKey(env).toUpperCase()
  const entries = config.environments.map((env) => `${constant(env)}(${kotlinString(env)})`).join(', ')
  const kotlinTypes = { string: 'String', url: 'String', boolean: 'Boolean', int: 'Int' }
  const literal = (/** @type {ConfigValue} */ v, /** @type {string | boolean | number} */ x) =>
    v.type === 'boolean' || v.type === 'int' ? String(x) : kotlinString(String(x))
  const members = sortedValues(config).map(([name, v]) => {
    const rows = config.environments
      .map((env) => `        AppEnvironment.${constant(env)} -> ${literal(v, v.perEnv[env])}`)
      .join('\n')
    const doc = v.description ? `    /** ${docText(v.description)} */\n` : ''
    return `${doc}    val ${name}: ${kotlinTypes[v.type]} = when (AppEnvironment.current) {\n${rows}\n    }`
  })
  return `// ${banner(SOURCE)}
package app.generated

import app.BuildConfig

/** The environments this app can be built for. */
enum class AppEnvironment(val key: String) {
    ${entries};

    companion object {
        /**
         * The environment this build was made for: development for debug builds, production for release builds,
         * or whatever \`./gradlew -PappEnvironment=staging\` asked for.
         */
        val current: AppEnvironment = entries.firstOrNull { it.key == BuildConfig.APP_ENVIRONMENT }
            ?: error("APP_ENVIRONMENT is \\"\${BuildConfig.APP_ENVIRONMENT}\\". Use one of: ${config.environments.join(', ')}.")
    }
}

/** Settings that differ per environment, shared with the iOS and web apps. */
object AppConfig {${members.length ? `\n${members.join('\n\n')}\n` : ''}}
`
}

/** @param {Config} config */
function typescript(config) {
  const tsTypes = { string: 'string', url: 'string', boolean: 'boolean', int: 'number' }
  const names = JSON.stringify(config.environments)
  const members = sortedValues(config).map(([name, v]) => {
    const rows = config.environments.map((env) => `${env}: ${JSON.stringify(v.perEnv[env])}`).join(', ')
    const doc = v.description ? `  /** ${docText(v.description)} */\n` : ''
    return `${doc}  ${name}: pick<${tsTypes[v.type]}>({ ${rows} }),`
  })
  // The tsconfig has noUnusedLocals, so `pick` is only declared when something uses it.
  const pick = members.length
    ? '\nconst pick = <T>(values: Record<AppEnvironment, T>): T => values[environment]\n'
    : ''
  return `// ${banner(SOURCE)}

/** The environments this app can be built for. */
export const environments = ${names} as const
export type AppEnvironment = (typeof environments)[number]

// "||" rather than "??": a variable that is set but empty (VITE_APP_ENVIRONMENT=) means "use the default".
const requested: string =
  import.meta.env.VITE_APP_ENVIRONMENT || (import.meta.env.DEV ? 'development' : 'production')
if (!(environments as readonly string[]).includes(requested)) {
  throw new Error(\`VITE_APP_ENVIRONMENT is "\${requested}". Use one of: ${config.environments.join(', ')}.\`)
}

/** The environment this build was made for: VITE_APP_ENVIRONMENT, else development when serving and production when built. */
export const environment = requested as AppEnvironment
${pick}
/** Settings that differ per environment, shared with the iOS and Android apps. */
export const AppConfig = {${members.length ? `\n${members.join('\n')}\n` : ''}} as const
`
}

// ---------- Secrets ----------

const LOCAL_NOTE = 'Local file: it holds secret values and is ignored by git.'

/** @param {Config} config @param {Record<string, string>} values */
function swiftSecrets(config, values) {
  const members = Object.entries(config.secrets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([name, { description }]) => `${description ? `    /// ${docText(description)}\n` : ''}    static let ${name} = ${swiftString(values[name] ?? '')}`)
  return `// ${banner(`${SOURCE} and .env`)}
// ${LOCAL_NOTE}

/// Secrets declared in contracts/config.json, with values from .env when \`make gen\` ran.
nonisolated enum AppSecrets {
${members.join('\n')}
}
`
}

/** @param {Config} config @param {Record<string, string>} values */
function kotlinSecrets(config, values) {
  const members = Object.entries(config.secrets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([name, { description }]) => `${description ? `    /** ${docText(description)} */\n` : ''}    val ${name}: String = ${kotlinString(values[name] ?? '')}`)
  return `// ${banner(`${SOURCE} and .env`)}
// ${LOCAL_NOTE}
package app.generated

/** Secrets declared in contracts/config.json, with values from .env when \`make gen\` ran. */
object AppSecrets {
${members.join('\n')}
}
`
}

/** @param {Config} config */
function typescriptSecrets(config) {
  const sorted = Object.entries(config.secrets).sort(([a], [b]) => (a < b ? -1 : 1))
  const keys = sorted.map(([name, { envKey: key }]) => `  ${name}: ${JSON.stringify(key)},`).join('\n')
  const getters = sorted
    .map(([name, { description }]) => `${description ? `  /** ${docText(description)} */\n` : ''}  get ${name}(): string {\n    return secret('${name}')\n  },`)
    .join('\n')
  return `// ${banner(SOURCE)}
/// <reference types="node" />

/** The .env key of each secret declared in contracts/config.json. */
const keys = {
${keys}
} as const

function secret(name: keyof typeof keys): string {
  if (typeof window !== 'undefined') {
    throw new Error(\`AppSecrets.\${name} is server-only. Read it in a server function or API route, never in a component.\`)
  }
  const value = process.env[keys[name]]
  if (!value) {
    throw new Error(\`\${keys[name]} is not set. Add it to .env (see .env.example) or to the server's environment.\`)
  }
  return value
}

/** Server-only secrets, read from the environment when first used. Never import this from client code. */
export const AppSecrets = {
${getters}
}
`
}

/** @param {Config} config */
function envExample(config) {
  const entries = Object.entries(config.secrets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, { description, envKey: key }]) => `${description ? `# ${docText(description)}\n` : ''}${key}=`)
  return `# ${banner(SOURCE)}
# Copy this file to .env and fill in the values. .env is ignored by git.

${entries.join('\n\n')}
`
}
