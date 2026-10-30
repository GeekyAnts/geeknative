// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { CliError } from './log.js'

const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * Parses the text of a .env file into a map. The CLI has no dependencies, so this is a small
 * subset of dotenv: KEY=value lines, `#` comments, an optional `export `, and quoted values.
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseEnv(text) {
  /** @type {Record<string, string>} */
  const env = {}
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim().replace(/^export\s+/, '')
    if (!line || line.startsWith('#')) return
    const equals = line.indexOf('=')
    const key = equals === -1 ? '' : line.slice(0, equals).trim()
    if (!KEY.test(key)) throw new CliError(`.env line ${index + 1} is not KEY=value.`)
    env[key] = parseValue(line.slice(equals + 1).trim())
  })
  return env
}

/** @param {string} value */
function parseValue(value) {
  const quote = value[0]
  if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
    const inner = value.slice(1, value.lastIndexOf(quote))
    // Single quotes are literal. Double quotes understand \n, \" and \\.
    return quote === "'" ? inner : inner.replace(/\\([n"\\])/g, (_, c) => (c === 'n' ? '\n' : c))
  }
  // Unquoted: a " #" starts a trailing comment.
  return value.replace(/\s+#.*$/, '')
}

/**
 * The project's .env, or null when there isn't one.
 * @param {string} root
 * @returns {Record<string, string> | null}
 */
export function readEnvFile(root) {
  const file = path.join(root, '.env')
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : null
}

/**
 * The entries of the project's .env that the real environment doesn't already set, for passing
 * to a child process (the web dev server and build). The real environment wins, as in dotenv.
 * @param {string} root
 * @returns {Record<string, string>}
 */
export function dotenvForChild(root) {
  /** @type {Record<string, string>} */
  const entries = {}
  for (const [key, value] of Object.entries(readEnvFile(root) ?? {})) {
    if (process.env[key] === undefined) entries[key] = value
  }
  return entries
}

/**
 * The environment `check` and `run` should build, from GEEKNATIVE_ENV. Undefined means "use the
 * defaults": development for debug builds and production for release builds.
 * @param {string[]} environments the names declared in contracts/config.json
 * @returns {string | undefined}
 */
export function requestedEnvironment(environments) {
  const requested = process.env.GEEKNATIVE_ENV
  if (!requested) return undefined
  if (!environments.includes(requested)) {
    throw new CliError(`GEEKNATIVE_ENV is "${requested}". contracts/config.json declares: ${environments.join(', ')}.`)
  }
  return requested
}
