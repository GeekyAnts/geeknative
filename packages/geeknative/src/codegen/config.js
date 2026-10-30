// @ts-check
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, snakeKey } from './util.js'

const SOURCE = 'contracts/config.json'
const TOP_LEVEL_KEYS = ['environments', 'values', 'secrets']
const VALUE_TYPES = ['string', 'url', 'boolean', 'int']

/**
 * @typedef {'string' | 'url' | 'boolean' | 'int'} ValueType
 * @typedef {{ type: ValueType, description?: string, perEnv: Record<string, string | boolean | number> }} ConfigValue
 * @typedef {{ description?: string, envKey: string }} ConfigSecret
 * @typedef {{ environments: string[], values: Record<string, ConfigValue>, secrets: Record<string, ConfigSecret> }} Config
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
