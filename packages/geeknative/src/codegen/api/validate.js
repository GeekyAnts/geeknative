// @ts-check
import { CliError } from '../../lib/log.js'
import { assertIdentifier } from '../util.js'
import { SOURCE, taskName } from './names.js'

/** @typedef {import('./types.js').ApiType} ApiType */
/** @typedef {import('./types.js').ApiField} ApiField */
/** @typedef {import('./types.js').ApiModel} ApiModel */
/** @typedef {import('./types.js').ApiParam} ApiParam */
/** @typedef {import('./types.js').ApiOperation} ApiOperation */
/** @typedef {import('./types.js').ApiContract} ApiContract */

const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])
/** RFC 3986 path characters, plus {name} placeholders. Anything else breaks percentEncodedPath on iOS. */
const PATH_KEY = /^\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/]|%[0-9A-Fa-f]{2}|\{[A-Za-z][A-Za-z0-9]*\})*$/
const UNSUPPORTED = new Set(['oneOf', 'anyOf', 'allOf', 'not', 'callbacks', 'links', 'webhooks'])

/**
 * @param {any} raw
 * @param {{ paths?: Record<string, string>, schemas?: Record<string, string> }} [owners] task file for each path and schema
 * @returns {ApiContract}
 */
export function validateApi(raw, owners = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CliError(`${SOURCE} must be an OpenAPI 3.1 object.`)
  }
  rejectUnsupported(raw, SOURCE)
  if (typeof raw.openapi !== 'string' || !raw.openapi.startsWith('3.1')) {
    throw new CliError(`${SOURCE} openapi must be a 3.1.x string (got ${JSON.stringify(raw.openapi)}).`)
  }
  if (!raw.info || typeof raw.info !== 'object' || typeof raw.info.title !== 'string' || typeof raw.info.version !== 'string') {
    throw new CliError(`${SOURCE} info needs string "title" and "version".`)
  }

  const schemaEntries = raw.components?.schemas ?? {}
  if (raw.components != null && (typeof raw.components !== 'object' || Array.isArray(raw.components))) {
    throw new CliError(`${SOURCE} components must be an object.`)
  }
  if (typeof schemaEntries !== 'object' || Array.isArray(schemaEntries)) {
    throw new CliError(`${SOURCE} components.schemas must be an object.`)
  }

  /** @type {ApiModel[]} */
  const models = []
  for (const [name, schema] of Object.entries(schemaEntries)) {
    assertTypeName(name, `${SOURCE} components.schemas`)
    const model = readModel(name, schema, `${SOURCE} components.schemas.${name}`, schemaEntries)
    model.task = taskName(owners.schemas?.[name])
    models.push(model)
  }
  models.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  const paths = raw.paths ?? {}
  if (typeof paths !== 'object' || Array.isArray(paths)) {
    throw new CliError(`${SOURCE} paths must be an object.`)
  }

  /** @type {ApiOperation[]} */
  const operations = []
  const seenIds = new Set()
  for (const [pathKey, item] of Object.entries(paths)) {
    if (typeof pathKey !== 'string' || !pathKey.startsWith('/')) {
      throw new CliError(`${SOURCE} paths keys must start with "/" (got ${JSON.stringify(pathKey)}).`)
    }
    // iOS assigns the path to percentEncodedPath, which traps on a character that still needs encoding.
    if (!PATH_KEY.test(pathKey)) {
      throw new CliError(
        `${SOURCE} paths key ${JSON.stringify(pathKey)} has characters that are not valid in a URL path. Percent-encode them in the path, or put them in a {parameter}.`,
      )
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new CliError(`${SOURCE} paths.${pathKey} must be an object.`)
    }
    rejectUnsupported(item, `${SOURCE} paths.${pathKey}`)
    for (const [method, operation] of Object.entries(item)) {
      if (!METHODS.has(method)) {
        if (method === 'parameters' || method === 'summary' || method === 'description' || method.startsWith('x-')) continue
        throw new CliError(`${SOURCE} paths.${pathKey} has unsupported key "${method}". Use get/post/put/patch/delete.`)
      }
      const op = readOperation(pathKey, method, operation, schemaEntries, seenIds)
      op.task = taskName(owners.paths?.[pathKey])
      operations.push(op)
    }
  }
  operations.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (!models.length && !operations.length) {
    throw new CliError(`${SOURCE} needs at least one components.schemas entry or paths operation.`)
  }
  return { models, operations }
}

/** @param {string} name @param {string} where */
function assertTypeName(name, where) {
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new CliError(`${where} "${name}": schema names must be PascalCase letters and digits.`)
  }
}

/** @param {any} node @param {string} where */
function rejectUnsupported(node, where) {
  if (!node || typeof node !== 'object') return
  for (const key of Object.keys(node)) {
    if (UNSUPPORTED.has(key)) {
      throw new CliError(`${where} uses unsupported "${key}". Keep the OpenAPI subset simple (no ${key}).`)
    }
  }
}

/**
 * @param {string} name
 * @param {any} schema
 * @param {string} where
 * @param {Record<string, any>} schemas
 * @returns {ApiModel}
 */
function readModel(name, schema, where, schemas) {
  rejectUnsupported(schema, where)
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new CliError(`${where} must be an object schema.`)
  }
  if (schema.type && schema.type !== 'object') {
    throw new CliError(`${where} must have type "object" (got ${JSON.stringify(schema.type)}).`)
  }
  if (schema.enum) {
    throw new CliError(`${where}: top-level enum schemas are not supported yet. Use string fields with enum.`)
  }
  const required = new Set(Array.isArray(schema.required) ? schema.required : [])
  const properties = schema.properties ?? {}
  if (typeof properties !== 'object' || Array.isArray(properties)) {
    throw new CliError(`${where} properties must be an object.`)
  }
  /** @type {ApiField[]} */
  const fields = []
  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    assertIdentifier(fieldName, `${where} property`)
    fields.push({
      name: fieldName,
      required: required.has(fieldName),
      type: readType(fieldSchema, `${where}.properties.${fieldName}`, schemas),
    })
  }
  fields.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  if (!fields.length) throw new CliError(`${where} needs at least one property.`)
  return { name, fields, task: 'api' }
}

/**
 * @param {any} schema
 * @param {string} where
 * @param {Record<string, any>} schemas
 * @returns {ApiType}
 */
function readType(schema, where, schemas) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new CliError(`${where} must be a schema object.`)
  }
  rejectUnsupported(schema, where)
  if (typeof schema.$ref === 'string') {
    const match = schema.$ref.match(/^#\/components\/schemas\/([A-Za-z][A-Za-z0-9]*)$/)
    if (!match) {
      throw new CliError(`${where} $ref must be "#/components/schemas/Name" (got ${JSON.stringify(schema.$ref)}).`)
    }
    if (!Object.prototype.hasOwnProperty.call(schemas, match[1])) {
      throw new CliError(`${where} $ref "#/components/schemas/${match[1]}" does not exist.`)
    }
    return { kind: 'ref', name: match[1] }
  }
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.length || schema.enum.some((v) => typeof v !== 'string')) {
      throw new CliError(`${where} enum must be a non-empty list of strings.`)
    }
    return { kind: 'enum', values: schema.enum }
  }
  if (schema.type === 'array') {
    if (!schema.items) throw new CliError(`${where} array needs "items".`)
    return { kind: 'array', items: readType(schema.items, `${where}.items`, schemas) }
  }
  if (schema.type === 'string') return { kind: 'string' }
  if (schema.type === 'integer') return { kind: 'integer' }
  if (schema.type === 'number') return { kind: 'number' }
  if (schema.type === 'boolean') return { kind: 'boolean' }
  if (schema.type === 'object') {
    throw new CliError(`${where}: inline objects are not supported. Put the shape in components.schemas and $ref it.`)
  }
  throw new CliError(`${where} needs type string|integer|number|boolean|array, an enum, or a $ref.`)
}

/**
 * @param {string} pathKey
 * @param {string} method
 * @param {any} operation
 * @param {Record<string, any>} schemas
 * @param {Set<string>} seenIds
 * @returns {ApiOperation}
 */
function readOperation(pathKey, method, operation, schemas, seenIds) {
  const where = `${SOURCE} paths.${pathKey}.${method}`
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new CliError(`${where} must be an object.`)
  }
  rejectUnsupported(operation, where)
  if (typeof operation.operationId !== 'string' || !operation.operationId) {
    throw new CliError(`${where} needs an operationId.`)
  }
  assertIdentifier(operation.operationId, `${where} operationId`)
  if (seenIds.has(operation.operationId)) {
    throw new CliError(`${SOURCE} operationId "${operation.operationId}" is used twice.`)
  }
  seenIds.add(operation.operationId)

  /** @type {ApiParam[]} */
  const pathParams = []
  /** @type {ApiParam[]} */
  const queryParams = []
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : []
  for (const [index, param] of parameters.entries()) {
    const pWhere = `${where}.parameters[${index}]`
    if (!param || typeof param !== 'object') throw new CliError(`${pWhere} must be an object.`)
    if (typeof param.name !== 'string') throw new CliError(`${pWhere} needs a name.`)
    assertIdentifier(param.name, `${pWhere} name`)
    if (param.in !== 'path' && param.in !== 'query') {
      throw new CliError(`${pWhere} in must be "path" or "query" (got ${JSON.stringify(param.in)}).`)
    }
    const required = param.in === 'path' ? true : Boolean(param.required)
    const type = readType(param.schema ?? { type: 'string' }, `${pWhere}.schema`, schemas)
    if (type.kind === 'array' || type.kind === 'ref' || type.kind === 'void') {
      throw new CliError(
        `${pWhere}: path and query parameters must be string, integer, number, boolean, or a string enum (no arrays).`,
      )
    }
    const entry = { name: param.name, in: /** @type {'path' | 'query'} */ (param.in), type, required }
    if (param.in === 'path') pathParams.push(entry)
    else queryParams.push(entry)
  }

  const pathPlaceholders = [...pathKey.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1])
  for (const name of pathPlaceholders) {
    if (!pathParams.some((p) => p.name === name)) {
      throw new CliError(`${where}: path has {${name}} but no matching path parameter.`)
    }
  }
  for (const param of pathParams) {
    if (!pathPlaceholders.includes(param.name)) {
      throw new CliError(`${where}: path parameter "${param.name}" is not in the path.`)
    }
  }

  /** @type {ApiType | null} */
  let requestBody = null
  if (operation.requestBody != null) {
    requestBody = readJsonContent(operation.requestBody, `${where}.requestBody`, schemas)
  }

  const responses = operation.responses
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    throw new CliError(`${where} needs responses.`)
  }
  const success = responses['200'] ?? responses['201'] ?? responses['204'] ?? responses.default
  if (!success) {
    throw new CliError(`${where} needs a 200, 201, 204, or default response.`)
  }
  const response = readSuccessType(success, `${where}.responses`, schemas)

  return {
    id: operation.operationId,
    method: method.toUpperCase(),
    path: pathKey,
    pathParams,
    queryParams,
    requestBody,
    response,
    task: 'api',
  }
}

/**
 * Success with no JSON body (including 204) is void.
 * @param {any} container
 * @param {string} where
 * @param {Record<string, any>} schemas
 * @returns {ApiType}
 */
function readSuccessType(container, where, schemas) {
  if (!container || typeof container !== 'object') throw new CliError(`${where} must be an object.`)
  const json = container.content?.['application/json']
  if (!json || typeof json !== 'object' || !json.schema) {
    return { kind: 'void' }
  }
  return readType(json.schema, `${where}.content["application/json"].schema`, schemas)
}

function readJsonContent(container, where, schemas) {
  if (!container || typeof container !== 'object') throw new CliError(`${where} must be an object.`)
  const content = container.content
  if (!content || typeof content !== 'object') {
    throw new CliError(`${where} needs content["application/json"].schema.`)
  }
  const json = content['application/json']
  if (!json || typeof json !== 'object' || !json.schema) {
    throw new CliError(`${where} needs content["application/json"].schema.`)
  }
  return readType(json.schema, `${where}.content["application/json"].schema`, schemas)
}
