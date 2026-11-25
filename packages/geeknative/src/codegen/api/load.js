// @ts-check
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../../lib/fsutil.js'
import { CliError } from '../../lib/log.js'
import { readApp } from '../app.js'
import { clientName, pascalTask, SOURCE, taskName } from './names.js'
import { validateApi } from './validate.js'

/** @typedef {import('./types.js').ApiContract} ApiContract */

const SINGLE = 'contracts/api.json'
/** One file per task, plus common.json for schemas shared across tasks. Not api.json. */
const TASK_FILE = /^(common|[a-z0-9]+(?:-[a-z0-9]+)*)\.json$/

/** Generated transport files and types a task file must not replace. */
const RESERVED_GENERATED = new Set(['ApiError', 'ApiException', 'ApiTransport'])

/** @param {string} task @param {string} file */
function assertTaskName(task, file) {
  if (task === 'transport' || pascalTask(task) === 'ApiTransport' || RESERVED_GENERATED.has(clientName(task))) {
    throw new CliError(
      `${file} would overwrite a generated transport file or type (transport.ts, ApiTransport, ApiError, ApiException). Name the task after what it does, like posts.json.`,
    )
  }
}

/**
 * Reads every task file in contracts/api/ and merges them into one contract.
 * A single contracts/api.json is rejected: each task has its own file.
 * @param {string} root
 * @returns {ApiContract | null}
 */
export function readApi(root) {
  if (existsSync(path.join(root, SINGLE))) {
    throw new CliError(
      `${SINGLE} is not a contract. Split the API by task into ${SOURCE}/<task>.json (one file per task, and ${SOURCE}/common.json for schemas shared by more than one task), then run \`make gen\`.`,
    )
  }
  const dir = path.join(root, SOURCE)
  if (!existsSync(dir)) return null
  const names = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  if (!names.length) return null
  const slices = names.map((name) => {
    if (name === 'api.json' || !TASK_FILE.test(name)) {
      throw new CliError(`${SOURCE}/${name} must be named after the task, like posts.json, or common.json for shared schemas.`)
    }
    const file = `${SOURCE}/${name}`
    assertTaskName(taskName(file), file)
    return { file, raw: readJson(path.join(dir, name), file) }
  })
  const app = readApp(root)
  const merged = mergeApiSlices(slices, { title: app.name, version: app.version })
  return validateApi(merged.document, { paths: merged.pathOwners, schemas: merged.schemaOwners })
}

/**
 * Combines per-task slices into one OpenAPI document. Each slice has `paths` and `components.schemas` only.
 * `$ref`s resolve after the merge, so a task file can point at a schema in common.json.
 * @param {{ file: string, raw: any }[]} slices
 * @param {{ title: string, version: string }} info
 */
export function mergeApiSlices(slices, info) {
  /** @type {Record<string, any>} */
  const paths = {}
  /** @type {Record<string, any>} */
  const schemas = {}
  /** @type {Record<string, string>} */
  const pathOwner = {}
  /** @type {Record<string, string>} */
  const schemaOwner = {}
  for (const { file, raw } of slices) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new CliError(`${file} must be an object with "paths" and "components".`)
    }
    for (const key of Object.keys(raw)) {
      if (key !== 'paths' && key !== 'components') {
        throw new CliError(`${file} must contain only "paths" and "components" (got "${key}"). One file per task; do not write a single OpenAPI document.`)
      }
    }
    const slicePaths = raw.paths ?? {}
    if (typeof slicePaths !== 'object' || Array.isArray(slicePaths)) throw new CliError(`${file} paths must be an object.`)
    for (const [pathKey, item] of Object.entries(slicePaths)) {
      if (pathOwner[pathKey]) {
        throw new CliError(`${file} and ${pathOwner[pathKey]} both define ${pathKey}. Keep each path in one task file.`)
      }
      pathOwner[pathKey] = file
      paths[pathKey] = item
    }
    const components = raw.components ?? {}
    if (typeof components !== 'object' || Array.isArray(components)) throw new CliError(`${file} components must be an object.`)
    for (const key of Object.keys(components)) {
      if (key !== 'schemas') throw new CliError(`${file} components may only contain "schemas" (got "${key}").`)
    }
    const sliceSchemas = components.schemas ?? {}
    if (typeof sliceSchemas !== 'object' || Array.isArray(sliceSchemas)) {
      throw new CliError(`${file} components.schemas must be an object.`)
    }
    for (const [name, schema] of Object.entries(sliceSchemas)) {
      if (schemaOwner[name]) {
        throw new CliError(`${file} and ${schemaOwner[name]} both define schema "${name}". Put a shared schema in ${SOURCE}/common.json.`)
      }
      schemaOwner[name] = file
      schemas[name] = schema
    }
    if (!Object.keys(slicePaths).length && !Object.keys(sliceSchemas).length) {
      throw new CliError(`${file} needs at least one path or one schema.`)
    }
  }
  return {
    document: {
      openapi: '3.1.0',
      info: { title: info.title, version: info.version },
      paths,
      components: { schemas },
    },
    pathOwners: pathOwner,
    schemaOwners: schemaOwner,
  }
}
