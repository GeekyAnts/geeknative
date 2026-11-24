// @ts-check
import { banner } from '../util.js'
import { clientName, SOURCE } from './names.js'

/** @typedef {import('./types.js').ApiType} ApiType */
/** @typedef {import('./types.js').ApiModel} ApiModel */
/** @typedef {import('./types.js').ApiOperation} ApiOperation */
/** @typedef {import('./types.js').ApiContract} ApiContract */

/** @param {ApiType} type */
function kotlinType(type) {
  switch (type.kind) {
    case 'string':
    case 'enum':
      return 'String'
    case 'integer':
      return 'Long'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Boolean'
    case 'ref':
      return type.name
    case 'array':
      return `List<${kotlinType(type.items)}>`
    case 'void':
      return 'Unit'
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
  const helpers = api.models.map(kotlinModelJson).join('\n\n')
  return [classes, helpers].filter(Boolean).join('\n\n')
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
      return `when (val v = ${expr}) { is Number -> v.toLong(); else -> v.toString().toLong() }`
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

/** @param {ApiContract} api @param {string} name */
function kotlinClient(api, name) {
  const methods = api.operations
    .map((op) => {
      const params = kotlinParamsList(op)
      const responseType = kotlinType(op.response)
      let pathExpr = JSON.stringify(op.path)
      for (const param of op.pathParams) {
        pathExpr = `${pathExpr}.replace("{${param.name}}", ApiTransport.encodePathSegment(${param.name}.toString()))`
      }
      const queryItems = op.queryParams.map((param) =>
        param.required
          ? `${JSON.stringify(param.name)} to ${param.name}.toString()`
          : `${param.name}?.let { ${JSON.stringify(param.name)} to it.toString() }`,
      )
      const queryArg = queryItems.length
        ? `,\n            query = listOfNotNull(\n${queryItems.map((item) => `                ${item},`).join('\n')}\n            )`
        : ''
      const bodyArg = op.requestBody == null ? '' : `,\n            body = ${kotlinEncode(op.requestBody, 'body')}.toString()`
      const request = `ApiTransport.request(
            method = ${JSON.stringify(op.method)},
            path = ${pathExpr}${queryArg}${bodyArg}
        )`
      if (op.response.kind === 'void') {
        return `    suspend fun ${op.id}(${params}): ${responseType} {
        ${request}
    }`
      }
      return `    suspend fun ${op.id}(${params}): ${responseType} {
        val json = org.json.JSONTokener(${request}).nextValue()
        return ${kotlinDecode(op.response, 'json')}
    }`
    })
    .join('\n\n')

  return `object ${name} {
${methods || '    // No operations declared.\n'}
}`
}

export function kotlinTransport() {
  return `// ${banner(SOURCE)}
package app.generated.api

import app.generated.AppConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ApiException(val status: Int, val body: String) : Exception("HTTP \$status: \$body")

object ApiTransport {
    suspend fun request(
        method: String,
        path: String,
        query: List<Pair<String, String>> = emptyList(),
        body: String? = null,
    ): String = withContext(Dispatchers.IO) {
        val queryString = if (query.isEmpty()) "" else query.joinToString("&", prefix = "?") { (name, value) ->
            name + "=" + java.net.URLEncoder.encode(value, Charsets.UTF_8.name())
        }
        val url = java.net.URL(AppConfig.apiBaseUrl.trimEnd('/') + path + queryString)
        val connection = (url.openConnection() as java.net.HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15_000
            readTimeout = 15_000
            doOutput = body != null
            if (body != null) setRequestProperty("Content-Type", "application/json")
        }
        try {
            if (body != null) connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw ApiException(code, text)
            text
        } finally {
            connection.disconnect()
        }
    }

    fun encodePathSegment(value: String): String =
        java.net.URLEncoder.encode(value, Charsets.UTF_8.name()).replace("+", "%20")
}
`
}

/** @param {ApiContract & { task: string }} slice @param {boolean} withClient */
export function kotlinTask(slice, withClient) {
  const models = kotlinModels(slice)
  const client = withClient ? kotlinClient(slice, clientName(slice.task)) : ''
  return `// ${banner(SOURCE)}
package app.generated.api

${[models, client].filter(Boolean).join('\n\n')}
`
}
