// @ts-check
import { banner } from '../util.js'
import { clientName, SOURCE } from './names.js'

/** @typedef {import('./types.js').ApiType} ApiType */
/** @typedef {import('./types.js').ApiModel} ApiModel */
/** @typedef {import('./types.js').ApiOperation} ApiOperation */
/** @typedef {import('./types.js').ApiContract} ApiContract */

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
    case 'void':
      return 'Void'
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
  return structs
}

/** @param {ApiOperation} op */
function swiftPathExpression(op) {
  let result = JSON.stringify(op.path)
  for (const param of op.pathParams) {
    result = `${result}.replacingOccurrences(of: "{${param.name}}", with: ApiTransport.encodePathSegment(String(${param.name})))`
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

/** @param {ApiContract} api @param {string} name */
function swiftClient(api, name) {
  const methods = api.operations
    .map((op) => {
      const params = swiftParamsList(op)
      const responseType = swiftType(op.response)
      const pathExpr = swiftPathExpression(op)
      const queryLines = op.queryParams
        .map((param) => {
          if (param.required) {
            return `                items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name})))`
          }
          return `                if let ${param.name} { items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name}))) }`
        })
        .join('\n')
      const queryArg = op.queryParams.length
        ? `,
            query: {
                var items: [URLQueryItem] = []
${queryLines}
                return items
            }()`
        : ''
      const bodyArg = op.requestBody == null ? '' : `,\n            body: JSONEncoder().encode(body)`
      const send = `ApiTransport.send(
            method: ${JSON.stringify(op.method)},
            path: ${pathExpr}${queryArg}${bodyArg}
        )`
      return `    static func ${op.id}(${params}) async throws -> ${responseType} {
        ${
          op.response.kind === 'void'
            ? `_ = try await ${send}`
            : `return try JSONDecoder().decode(${responseType}.self, from: await ${send})`
        }
    }`
    })
    .join('\n\n')

  return `nonisolated enum ${name} {
${methods || '    // No operations declared.\n'}
}`
}

export function swiftTransport() {
  return `// ${banner(SOURCE)}
import Foundation

nonisolated enum ApiError: Error, Sendable {
    case invalidResponse
    case httpStatus(Int, Data)
    case badURL(String)
}

nonisolated enum ApiTransport {
    static func makeURL(path: String, query: [URLQueryItem] = []) throws -> URL {
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

    static func send(method: String, path: String, query: [URLQueryItem] = [], body: Data? = nil) async throws -> Data {
        var request = URLRequest(url: try makeURL(path: path, query: query))
        request.httpMethod = method
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ApiError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw ApiError.httpStatus(http.statusCode, data)
        }
        return data
    }

    static func encodePathSegment(_ value: String) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
    }
}
`
}

/** @param {ApiContract & { task: string }} slice @param {boolean} withClient */
export function swiftTask(slice, withClient) {
  const models = swiftModels(slice)
  const client = withClient ? swiftClient(slice, clientName(slice.task)) : ''
  return `// ${banner(SOURCE)}
import Foundation

${[models, client].filter(Boolean).join('\n\n')}
`
}
