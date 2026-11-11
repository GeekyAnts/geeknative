// @ts-check
import { existsSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, OUT } from './util.js'

const SOURCE = 'contracts/api.json'
const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])
const UNSUPPORTED = new Set(['oneOf', 'anyOf', 'allOf', 'not', 'callbacks', 'links', 'webhooks'])

/**
 * @typedef {{ kind: 'string' | 'integer' | 'number' | 'boolean' }} ScalarType
 * @typedef {{ kind: 'enum', values: string[] }} EnumType
 * @typedef {{ kind: 'ref', name: string }} RefType
 * @typedef {{ kind: 'array', items: ApiType }} ArrayType
 * @typedef {ScalarType | EnumType | RefType | ArrayType} ApiType
 * @typedef {{ name: string, type: ApiType, required: boolean }} ApiField
 * @typedef {{ name: string, fields: ApiField[] }} ApiModel
 * @typedef {{ name: string, in: 'path' | 'query', type: ApiType, required: boolean }} ApiParam
 * @typedef {{
 *   id: string,
 *   method: string,
 *   path: string,
 *   pathParams: ApiParam[],
 *   queryParams: ApiParam[],
 *   requestBody: ApiType | null,
 *   response: ApiType,
 * }} ApiOperation
 * @typedef {{ models: ApiModel[], operations: ApiOperation[] }} ApiContract
 */

/** @param {string} root @returns {ApiContract | null} */
export function readApi(root) {
  const file = path.join(root, 'contracts', 'api.json')
  if (!existsSync(file)) return null
  return validateApi(readJson(file, SOURCE))
}

/**
 * @param {any} raw
 * @returns {ApiContract}
 */
export function validateApi(raw) {
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
    models.push(readModel(name, schema, `${SOURCE} components.schemas.${name}`, schemaEntries))
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
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new CliError(`${SOURCE} paths.${pathKey} must be an object.`)
    }
    rejectUnsupported(item, `${SOURCE} paths.${pathKey}`)
    for (const [method, operation] of Object.entries(item)) {
      if (!METHODS.has(method)) {
        if (method === 'parameters' || method === 'summary' || method === 'description' || method.startsWith('x-')) continue
        throw new CliError(`${SOURCE} paths.${pathKey} has unsupported key "${method}". Use get/post/put/patch/delete.`)
      }
      operations.push(readOperation(pathKey, method, operation, schemaEntries, seenIds))
    }
  }
  operations.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (!models.length && !operations.length) {
    throw new CliError(`${SOURCE} needs at least one components.schemas entry or paths operation.`)
  }
  return { models, operations }
}

/**
 * @param {ApiContract} api
 * @returns {{ path: string, content: string | Buffer, local?: boolean }[]}
 */
export function apiOutputs(api) {
  return [
    { path: `${OUT.iosGenerated}/ApiModels.swift`, content: swiftModels(api) },
    { path: `${OUT.iosGenerated}/ApiClient.swift`, content: swiftClient(api) },
    { path: `${OUT.androidKotlin}/ApiModels.kt`, content: kotlinModels(api) },
    { path: `${OUT.androidKotlin}/ApiClient.kt`, content: kotlinClient(api) },
    { path: `${OUT.webGenerated}/api.ts`, content: typescriptApi(api) },
  ]
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
  return { name, fields }
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
  const success = responses['200'] ?? responses['201'] ?? responses.default
  if (!success) {
    throw new CliError(`${where} needs a 200, 201, or default response with JSON.`)
  }
  const response = readJsonContent(success, `${where}.responses`, schemas)

  return {
    id: operation.operationId,
    method: method.toUpperCase(),
    path: pathKey,
    pathParams,
    queryParams,
    requestBody,
    response,
  }
}

/**
 * @param {any} container
 * @param {string} where
 * @param {Record<string, any>} schemas
 * @returns {ApiType}
 */
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

// ---------- Emitters ----------

/** @param {ApiType} type */
function swiftType(type) {
  switch (type.kind) {
    case 'string':
    case 'enum':
      return 'String'
    case 'integer':
      return 'Int'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Bool'
    case 'ref':
      return type.name
    case 'array':
      return `[${swiftType(type.items)}]`
  }
}

/** @param {ApiType} type @param {boolean} optional */
function swiftFieldType(type, optional) {
  const base = swiftType(type)
  return optional ? `${base}?` : base
}

/** @param {ApiContract} api */
function swiftModels(api) {
  const structs = api.models
    .map((model) => {
      const props = model.fields
        .map((field) => `    var ${field.name}: ${swiftFieldType(field.type, !field.required)}`)
        .join('\n')
      return `nonisolated struct ${model.name}: Codable, Equatable, Sendable {\n${props}\n}`
    })
    .join('\n\n')
  return `// ${banner(SOURCE)}
import Foundation

${structs || '// No models declared.'}
`
}

/** @param {ApiOperation} op */
function swiftPathExpression(op) {
  let result = JSON.stringify(op.path)
  for (const param of op.pathParams) {
    result = `${result}.replacingOccurrences(of: "{${param.name}}", with: String(${param.name}))`
  }
  return result
}

/** @param {ApiOperation} op */
function swiftParamsList(op) {
  /** @type {string[]} */
  const parts = []
  for (const param of [...op.pathParams, ...op.queryParams]) {
    parts.push(`${param.name}: ${swiftFieldType(param.type, !param.required)}`)
  }
  if (op.requestBody) parts.push(`body: ${swiftType(op.requestBody)}`)
  return parts.join(', ')
}

/** @param {ApiContract} api */
function swiftClient(api) {
  const methods = api.operations
    .map((op) => {
      const params = swiftParamsList(op)
      const responseType = swiftType(op.response)
      const pathExpr = swiftPathExpression(op)
      const queryLines = op.queryParams
        .map((param) => {
          if (param.required) {
            return `        items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name})))`
          }
          return `        if let ${param.name} { items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name}))) }`
        })
        .join('\n')
      const bodyBlock =
        op.requestBody == null
          ? `        request.httpMethod = ${JSON.stringify(op.method)}
`
          : `        request.httpMethod = ${JSON.stringify(op.method)}
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
`
      const queryArg = op.queryParams.length
        ? `, query: {
        var items: [URLQueryItem] = []
${queryLines}
        return items
        }()`
        : ''
      return `    static func ${op.id}(${params}) async throws -> ${responseType} {
        let url = try makeURL(path: ${pathExpr}${queryArg})
        var request = URLRequest(url: url)
${bodyBlock}        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ApiError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw ApiError.httpStatus(http.statusCode, data)
        }
        return try JSONDecoder().decode(${responseType}.self, from: data)
    }`
    })
    .join('\n\n')

  return `// ${banner(SOURCE)}
import Foundation

nonisolated enum ApiError: Error, Sendable {
    case invalidResponse
    case httpStatus(Int, Data)
    case badURL(String)
}

nonisolated enum ApiClient {
${methods || '    // No operations declared.\n'}
    private static func makeURL(path: String, query: [URLQueryItem] = []) throws -> URL {
        guard var components = URLComponents(url: AppConfig.apiBaseUrl, resolvingAgainstBaseURL: false) else {
            throw ApiError.badURL(AppConfig.apiBaseUrl.absoluteString)
        }
        let basePath = components.path.hasSuffix("/") ? String(components.path.dropLast()) : components.path
        let suffix = path.hasPrefix("/") ? path : "/" + path
        components.path = basePath + suffix
        components.queryItems = query.isEmpty ? nil : query
        guard let url = components.url else { throw ApiError.badURL(path) }
        return url
    }
}
`
}

/** @param {ApiType} type */
function kotlinType(type) {
  switch (type.kind) {
    case 'string':
    case 'enum':
      return 'String'
    case 'integer':
      return 'Int'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Boolean'
    case 'ref':
      return type.name
    case 'array':
      return `List<${kotlinType(type.items)}>`
  }
}

/** @param {ApiType} type @param {boolean} optional */
function kotlinFieldType(type, optional) {
  const base = kotlinType(type)
  return optional ? `${base}?` : base
}

/** @param {ApiContract} api */
function kotlinModels(api) {
  const classes = api.models
    .map((model) => {
      const props = model.fields
        .map((field) => {
          const defaultValue = field.required ? '' : ' = null'
          return `    val ${field.name}: ${kotlinFieldType(field.type, !field.required)}${defaultValue},`
        })
        .join('\n')
      return `data class ${model.name}(\n${props}\n)`
    })
    .join('\n\n')
  return `// ${banner(SOURCE)}
package app.generated

${classes || '// No models declared.'}
`
}

/** @param {ApiOperation} op */
function kotlinParamsList(op) {
  /** @type {string[]} */
  const parts = []
  for (const param of [...op.pathParams, ...op.queryParams]) {
    const defaultValue = param.required ? '' : ' = null'
    parts.push(`${param.name}: ${kotlinFieldType(param.type, !param.required)}${defaultValue}`)
  }
  if (op.requestBody) parts.push(`body: ${kotlinType(op.requestBody)}`)
  return parts.join(', ')
}

/** @param {ApiType} type @param {string} expr */
function kotlinDecode(type, expr) {
  switch (type.kind) {
    case 'string':
    case 'enum':
      return `${expr}.toString()`
    case 'integer':
      return `when (val v = ${expr}) { is Number -> v.toInt(); else -> v.toString().toInt() }`
    case 'number':
      return `when (val v = ${expr}) { is Number -> v.toDouble(); else -> v.toString().toDouble() }`
    case 'boolean':
      return `when (val v = ${expr}) { is Boolean -> v; else -> v.toString().toBoolean() }`
    case 'ref':
      return `${type.name}Json.decode(${expr})`
    case 'array':
      return `(${expr} as org.json.JSONArray).let { arr -> (0 until arr.length()).map { i -> ${kotlinDecode(type.items, 'arr.get(i)')} } }`
  }
}

/** @param {ApiType} type @param {string} expr */
function kotlinEncode(type, expr) {
  switch (type.kind) {
    case 'string':
    case 'enum':
    case 'integer':
    case 'number':
    case 'boolean':
      return expr
    case 'ref':
      return `${type.name}Json.encode(${expr})`
    case 'array':
      return `org.json.JSONArray().also { arr -> ${expr}.forEach { arr.put(${kotlinEncode(type.items, 'it')}) } }`
  }
}

/** @param {ApiModel} model */
function kotlinModelJson(model) {
  const decodeFields = model.fields
    .map((field) => {
      if (field.required) {
        return `            ${field.name} = ${kotlinDecode(field.type, `obj.get("${field.name}")`)},`
      }
      return `            ${field.name} = if (obj.isNull("${field.name}")) null else ${kotlinDecode(field.type, `obj.get("${field.name}")`)},`
    })
    .join('\n')
  const encodeFields = model.fields
    .map((field) => {
      if (field.required) {
        return `            put(${JSON.stringify(field.name)}, ${kotlinEncode(field.type, `value.${field.name}`)})`
      }
      return `            if (value.${field.name} != null) put(${JSON.stringify(field.name)}, ${kotlinEncode(field.type, `value.${field.name}`)})`
    })
    .join('\n')
  return `internal object ${model.name}Json {
    fun decode(value: Any): ${model.name} {
        val obj = value as org.json.JSONObject
        return ${model.name}(
${decodeFields}
        )
    }

    fun encode(value: ${model.name}): org.json.JSONObject = org.json.JSONObject().apply {
${encodeFields}
    }
}`
}

/** @param {ApiContract} api */
function kotlinClient(api) {
  const helpers = api.models.map(kotlinModelJson).join('\n\n')
  const methods = api.operations
    .map((op) => {
      const params = kotlinParamsList(op)
      const responseType = kotlinType(op.response)
      let pathExpr = JSON.stringify(op.path)
      for (const param of op.pathParams) {
        pathExpr = `${pathExpr}.replace("{${param.name}}", ${param.name}.toString())`
      }
      const queryBuilds = op.queryParams
        .map((param) => {
          if (param.required) {
            return `        query += (if (query.isEmpty()) "?" else "&") + "${param.name}=" + java.net.URLEncoder.encode(${param.name}.toString(), Charsets.UTF_8.name())`
          }
          return `        if (${param.name} != null) query += (if (query.isEmpty()) "?" else "&") + "${param.name}=" + java.net.URLEncoder.encode(${param.name}.toString(), Charsets.UTF_8.name())`
        })
        .join('\n')
      const bodySetup =
        op.requestBody == null
          ? `        connection.doOutput = false\n`
          : `        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.outputStream.use { stream ->
            val payload = ${kotlinEncode(op.requestBody, 'body')}.toString().toByteArray(Charsets.UTF_8)
            stream.write(payload)
        }
`
      return `    suspend fun ${op.id}(${params}): ${responseType} = withContext(Dispatchers.IO) {
        var query = ""
${queryBuilds}
        val path = ${pathExpr}
        val url = java.net.URL(AppConfig.apiBaseUrl.trimEnd('/') + path + query)
        val connection = (url.openConnection() as java.net.HttpURLConnection).apply {
            requestMethod = ${JSON.stringify(op.method)}
            connectTimeout = 15_000
            readTimeout = 15_000
        }
${bodySetup}        try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw ApiException(code, text)
            val json = org.json.JSONTokener(text).nextValue()
            ${kotlinDecode(op.response, 'json')}
        } finally {
            connection.disconnect()
        }
    }`
    })
    .join('\n\n')

  return `// ${banner(SOURCE)}
package app.generated

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ApiException(val status: Int, val body: String) : Exception("HTTP \$status: \$body")

object ApiClient {
${methods || '    // No operations declared.\n'}
}

${helpers}
`
}

/** @param {ApiType} type */
function tsType(type) {
  switch (type.kind) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'enum':
      return type.values.map((v) => JSON.stringify(v)).join(' | ')
    case 'ref':
      return type.name
    case 'array':
      return `Array<${tsType(type.items)}>`
  }
}

/** @param {string} id */
function argsTypeName(id) {
  return `${id[0].toUpperCase()}${id.slice(1)}Args`
}

/** @param {ApiContract} api */
function typescriptApi(api) {
  const interfaces = api.models
    .map((model) => {
      const props = model.fields
        .map((field) => `  ${field.name}${field.required ? '' : '?'}: ${tsType(field.type)}`)
        .join('\n')
      return `export type ${model.name} = {\n${props}\n}`
    })
    .join('\n\n')

  const methods = api.operations
    .map((op) => {
      /** @type {string[]} */
      const fields = []
      for (const param of [...op.pathParams, ...op.queryParams]) {
        fields.push(`  ${param.name}${param.required ? '' : '?'}: ${tsType(param.type)}`)
      }
      if (op.requestBody) fields.push(`  body: ${tsType(op.requestBody)}`)
      const typeName = argsTypeName(op.id)
      const argsAlias = fields.length ? `export type ${typeName} = {\n${fields.join('\n')}\n}\n\n` : ''
      const argsParam = fields.length ? `args: ${typeName}, ` : ''
      const pathDecls = op.pathParams.map((p) => `  const ${p.name} = args.${p.name}`).join('\n')
      const queryDecls = op.queryParams.map((p) => `  const ${p.name} = args.${p.name}`).join('\n')
      const bodyDecl = op.requestBody ? `  const body = args.body` : ''
      let pathExpr = JSON.stringify(op.path)
      for (const param of op.pathParams) {
        pathExpr = `${pathExpr}.replaceAll(${JSON.stringify('{' + param.name + '}')}, encodeURIComponent(String(${param.name})))`
      }
      const queryLines = op.queryParams
        .map((param) => {
          if (param.required) {
            return `  query.set(${JSON.stringify(param.name)}, String(${param.name}))`
          }
          return `  if (${param.name} !== undefined) query.set(${JSON.stringify(param.name)}, String(${param.name}))`
        })
        .join('\n')
      const fetchBody =
        op.requestBody == null
          ? `    headers: init.headers,`
          : `    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body),`
      return `${argsAlias}export async function ${op.id}(${argsParam}init: RequestInit = {}): Promise<${tsType(op.response)}> {
${pathDecls}
${queryDecls}
${bodyDecl}
  const query = new URLSearchParams()
${queryLines}
  const path = ${pathExpr}
  const url = new URL(path.replace(/^\\//, ""), ensureTrailingSlash(String(AppConfig.apiBaseUrl)))
  url.search = query.toString()
  const response = await fetch(url, {
    ...init,
    method: ${JSON.stringify(op.method)},
${fetchBody}
  })
  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }
  return (await response.json()) as ${tsType(op.response)}
}`
    })
    .join('\n\n')

  return `// ${banner(SOURCE)}
import { AppConfig } from "./config"

export class ApiError extends Error {
  readonly status: number
  readonly body: string
  constructor(status: number, body: string) {
    super(\`HTTP \${status}: \${body}\`)
    this.status = status
    this.body = body
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : \`\${value}/\`
}

${interfaces || "/* No models declared. */"}

${methods || "/* No operations declared. */"}
`
}
