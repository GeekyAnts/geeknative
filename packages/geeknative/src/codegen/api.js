// @ts-check
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, OUT } from './util.js'

const SOURCE_DIR = 'contracts/api'
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * @typedef {{ kind: 'string' | 'integer' | 'number' | 'boolean' }} ScalarType
 * @typedef {{ kind: 'enum', values: string[] }} EnumType
 * @typedef {{ kind: 'ref', name: string }} RefType
 * @typedef {{ kind: 'array', items: ApiType }} ArrayType
 * @typedef {ScalarType | EnumType | RefType | ArrayType} ApiType
 * @typedef {{ name: string, type: ApiType, required: boolean }} ApiField
 * @typedef {{ name: string, fields: ApiField[], origin: string }} ApiModel
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
 * @typedef {{ models: ApiModel[], operations: ApiOperation[], sources: { name: string, content: string }[] }} ApiContract
 */

/** @param {string} root @returns {ApiContract | null} */
export function readApi(root) {
  const dir = path.join(root, 'contracts', 'api')
  if (!existsSync(dir)) return null
  const names = readdirSync(dir)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
    .sort()
  if (!names.length) return null

  const ts = loadTypescript(root)
  const fileNames = names.map((name) => path.join(dir, name))
  const program = ts.createProgram(fileNames, {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts'],
    types: [],
    noUnusedLocals: false,
    noUnusedParameters: false,
  })

  const diagnostics = [...ts.getPreEmitDiagnostics(program)].filter((d) => d.category === ts.DiagnosticCategory.Error)
  if (diagnostics.length) {
    throw new CliError(formatDiagnostics(ts, diagnostics))
  }

  /** @type {ApiModel[]} */
  const models = []
  /** @type {ApiOperation[]} */
  const operations = []
  /** @type {{ name: string, content: string }[]} */
  const sources = []
  const modelNames = new Set()

  for (const fileName of fileNames) {
    const sourceFile = program.getSourceFile(fileName)
    if (!sourceFile) continue
    const rel = `${SOURCE_DIR}/${path.basename(fileName)}`
    sources.push({ name: path.basename(fileName), content: sourceFile.getFullText() })
    rejectForbidden(ts, sourceFile, rel)
    for (const stmt of sourceFile.statements) {
      if (ts.isImportDeclaration(stmt)) {
        const spec = stmt.moduleSpecifier
        if (!ts.isStringLiteral(spec) || !spec.text.startsWith('.')) {
          throw new CliError(`${rel}: imports must stay inside ${SOURCE_DIR}/ (got ${spec.getText(sourceFile)}).`)
        }
        continue
      }
      if (ts.isInterfaceDeclaration(stmt) && isExported(ts, stmt)) {
        const model = readInterface(ts, stmt, sourceFile, rel)
        if (modelNames.has(model.name)) throw new CliError(`${rel}: model "${model.name}" is declared twice.`)
        modelNames.add(model.name)
        models.push(model)
        continue
      }
      if (ts.isTypeAliasDeclaration(stmt) && isExported(ts, stmt) && ts.isTypeLiteralNode(stmt.type)) {
        const model = readTypeLiteralAlias(ts, stmt, sourceFile, rel)
        if (modelNames.has(model.name)) throw new CliError(`${rel}: model "${model.name}" is declared twice.`)
        modelNames.add(model.name)
        models.push(model)
        continue
      }
      if (ts.isVariableStatement(stmt) && isExported(ts, stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name) || decl.name.text !== 'api') {
            throw new CliError(`${rel}: the only exported value allowed is \`export const api = { ... }\`.`)
          }
          if (operations.length) throw new CliError(`${rel}: \`api\` is exported more than once.`)
          operations.push(...readOperations(ts, decl, sourceFile, rel))
        }
        continue
      }
      if (ts.isExportDeclaration(stmt) && !stmt.exportClause) continue
      throw new CliError(`${rel}: only exported interfaces, type aliases of object shapes, and \`export const api\` are allowed.`)
    }
  }

  models.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  operations.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (!models.length && !operations.length) {
    throw new CliError(`${SOURCE_DIR}/ needs at least one model or operation.`)
  }
  for (const op of operations) {
    assertKnownTypes(op.response, `${SOURCE_DIR} ${op.id}.response`, modelNames)
    if (op.requestBody) assertKnownTypes(op.requestBody, `${SOURCE_DIR} ${op.id}.body`, modelNames)
    for (const param of [...op.pathParams, ...op.queryParams]) {
      assertKnownTypes(param.type, `${SOURCE_DIR} ${op.id}.${param.name}`, modelNames)
    }
  }
  return { models, operations, sources }
}

/**
 * @param {ApiContract} api
 * @returns {{ path: string, content: string | Buffer, local?: boolean }[]}
 */
export function apiOutputs(api) {
  const copied = api.sources.map((file) => ({
    path: `${OUT.webGenerated}/api/${file.name}`,
    content: `// ${banner(`${SOURCE_DIR}/${file.name}`)}\n${file.content.replace(/^\uFEFF/, '')}`,
  }))
  return [
    { path: `${OUT.iosGenerated}/ApiModels.swift`, content: swiftModels(api) },
    { path: `${OUT.iosGenerated}/ApiClient.swift`, content: swiftClient(api) },
    { path: `${OUT.androidKotlin}/ApiModels.kt`, content: kotlinModels(api) },
    { path: `${OUT.androidKotlin}/ApiClient.kt`, content: kotlinClient(api) },
    ...copied,
    { path: `${OUT.webGenerated}/api/client.ts`, content: typescriptClient(api) },
    { path: `${OUT.webGenerated}/api.ts`, content: typescriptBarrel(api) },
  ]
}

/** @param {string} root */
function loadTypescript(root) {
  const requireFrom = (/** @type {string} */ file) => {
    try {
      return createRequire(file)('typescript')
    } catch {
      return null
    }
  }
  const webPkg = path.join(root, 'apps', 'web', 'package.json')
  const rootPkg = path.join(root, 'package.json')
  const fromWeb = existsSync(webPkg) ? requireFrom(webPkg) : null
  if (fromWeb) return fromWeb
  const fromRoot = existsSync(rootPkg) ? requireFrom(rootPkg) : null
  if (fromRoot) return fromRoot
  const fromCli = requireFrom(fileURLToPath(import.meta.url))
  if (fromCli) return fromCli
  throw new CliError(
    `${SOURCE_DIR}/ needs TypeScript. Install it in the project (the web app already lists it) and rerun \`make gen\`.`,
  )
}

/** @param {any} ts @param {any[]} diagnostics */
function formatDiagnostics(ts, diagnostics) {
  return diagnostics
    .map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, '\n')
      if (!d.file || d.start == null) return `${SOURCE_DIR}/: ${message}`
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start)
      const rel = `${SOURCE_DIR}/${path.basename(d.file.fileName)}`
      return `${rel}:${line + 1}:${character + 1}: ${message}`
    })
    .join('\n')
}

/** @param {any} ts @param {any} node */
function isExported(ts, node) {
  return Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
}

/** @param {any} ts @param {any} sourceFile @param {string} rel */
function rejectForbidden(ts, sourceFile, rel) {
  /** @param {any} node */
  const visit = (node) => {
    if (ts.isClassDeclaration(node)) {
      throw new CliError(`${rel}: classes are not allowed in the API contract. Use an interface.`)
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      throw new CliError(`${rel}: \`any\` is not allowed. Use a concrete type.`)
    }
    if (ts.isMappedTypeNode(node) || ts.isConditionalTypeNode(node)) {
      throw new CliError(`${rel}: mapped and conditional types are not allowed.`)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

/**
 * @param {any} ts
 * @param {any} stmt
 * @param {any} sourceFile
 * @param {string} rel
 * @returns {ApiModel}
 */
function readInterface(ts, stmt, sourceFile, rel) {
  if (stmt.typeParameters?.length) throw new CliError(`${rel}: generics are not allowed on "${stmt.name.text}".`)
  if (stmt.heritageClauses?.length) throw new CliError(`${rel}: "${stmt.name.text}" cannot extend other types.`)
  assertTypeName(stmt.name.text, rel)
  return {
    name: stmt.name.text,
    origin: path.basename(sourceFile.fileName),
    fields: readMembers(ts, stmt.members, sourceFile, `${rel} ${stmt.name.text}`),
  }
}

/**
 * @param {any} ts
 * @param {any} stmt
 * @param {any} sourceFile
 * @param {string} rel
 * @returns {ApiModel}
 */
function readTypeLiteralAlias(ts, stmt, sourceFile, rel) {
  if (stmt.typeParameters?.length) throw new CliError(`${rel}: generics are not allowed on "${stmt.name.text}".`)
  assertTypeName(stmt.name.text, rel)
  return {
    name: stmt.name.text,
    origin: path.basename(sourceFile.fileName),
    fields: readMembers(ts, stmt.type.members, sourceFile, `${rel} ${stmt.name.text}`),
  }
}

/**
 * @param {any} ts
 * @param {any[]} members
 * @param {any} sourceFile
 * @param {string} where
 * @returns {ApiField[]}
 */
function readMembers(ts, members, sourceFile, where) {
  /** @type {ApiField[]} */
  const fields = []
  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) {
      throw new CliError(`${where}: only named object fields are allowed.`)
    }
    if (!member.type) throw new CliError(`${where}.${member.name.text} needs a type.`)
    assertIdentifier(member.name.text, `${where} field`)
    fields.push({
      name: member.name.text,
      required: !member.questionToken,
      type: readTypeNode(ts, member.type, sourceFile, `${where}.${member.name.text}`),
    })
  }
  if (!fields.length) throw new CliError(`${where} needs at least one field.`)
  fields.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return fields
}

/**
 * @param {any} ts
 * @param {any} decl
 * @param {any} sourceFile
 * @param {string} rel
 * @returns {ApiOperation[]}
 */
function readOperations(ts, decl, sourceFile, rel) {
  let expr = decl.initializer
  if (!expr) throw new CliError(`${rel}: \`api\` needs an object value.`)
  if (ts.isAsExpression(expr) && expr.type.kind === ts.SyntaxKind.TypeReference && expr.type.typeName.getText(sourceFile) === 'const') {
    expr = expr.expression
  }
  // `as const` is AsExpression to a const type assertion in TS 5+: `expr as const` is AsExpression with TypeReference? 
  // Actually `as const` is Satisfies or AsExpression with const keyword type: ConstKeyword? It's AsExpression where type is TypeReference 'const' OR isTypeAssertion.
  // In TS, `obj as const` -> AsExpression, type is TypeQuery? SyntaxKind.TypeOperator? 
  // It's AsExpression with type.kind === SyntaxKind.LiteralType? I'll unwrap all AsExpressions.
  while (ts.isAsExpression(expr) || ts.isSatisfiesExpression?.(expr)) {
    expr = expr.expression
  }
  if (!ts.isObjectLiteralExpression(expr)) {
    throw new CliError(`${rel}: \`api\` must be an object literal.`)
  }
  /** @type {ApiOperation[]} */
  const ops = []
  const seen = new Set()
  for (const prop of expr.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
      throw new CliError(`${rel}: each operation must be a named property.`)
    }
    assertIdentifier(prop.name.text, `${rel} operation`)
    if (seen.has(prop.name.text)) throw new CliError(`${rel}: operation "${prop.name.text}" is declared twice.`)
    seen.add(prop.name.text)
    ops.push(readOperation(ts, prop.name.text, prop.initializer, sourceFile, `${rel} ${prop.name.text}`))
  }
  return ops
}

/**
 * @param {any} ts
 * @param {string} id
 * @param {any} expr
 * @param {any} sourceFile
 * @param {string} where
 * @returns {ApiOperation}
 */
function readOperation(ts, id, expr, sourceFile, where) {
  let value = expr
  while (ts.isAsExpression(value)) value = value.expression
  if (!ts.isObjectLiteralExpression(value)) throw new CliError(`${where} must be an object \`{ method, path, response }\`.`)

  /** @type {Record<string, any>} */
  const fields = {}
  for (const prop of value.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
      throw new CliError(`${where}: use plain named fields (method, path, params, body, response).`)
    }
    fields[prop.name.text] = prop.initializer
  }
  const methodNode = fields.method
  const pathNode = fields.path
  const responseNode = fields.response
  if (!methodNode || !ts.isStringLiteral(methodNode)) {
    throw new CliError(`${where}.method must be a string literal like "GET".`)
  }
  const method = methodNode.text.toUpperCase()
  if (!METHODS.has(method)) throw new CliError(`${where}.method must be GET, POST, PUT, PATCH or DELETE.`)
  if (!pathNode || !ts.isStringLiteral(pathNode)) {
    throw new CliError(`${where}.path must be a string literal like "/stories/:id".`)
  }
  const pathValue = pathNode.text
  if (!pathValue.startsWith('/')) throw new CliError(`${where}.path must start with "/".`)
  if (!responseNode) throw new CliError(`${where}.response is required (use \`null as unknown as Story\`).`)

  const response = readTypeAssertion(ts, responseNode, sourceFile, `${where}.response`)
  const requestBody = fields.body ? readTypeAssertion(ts, fields.body, sourceFile, `${where}.body`) : null
  const placeholders = [...pathValue.matchAll(/:([A-Za-z][A-Za-z0-9]*)/g)].map((m) => m[1])
  /** @type {ApiParam[]} */
  const pathParams = []
  /** @type {ApiParam[]} */
  const queryParams = []
  const paramFields = readParamsShape(ts, fields.params, sourceFile, `${where}.params`)
  for (const field of paramFields) {
    if (placeholders.includes(field.name)) {
      pathParams.push({ name: field.name, in: 'path', type: field.type, required: true })
    } else {
      queryParams.push({ name: field.name, in: 'query', type: field.type, required: field.required })
    }
  }
  for (const name of placeholders) {
    if (!pathParams.some((p) => p.name === name)) {
      throw new CliError(`${where}: path has :${name} but params has no matching field.`)
    }
  }

  return { id, method, path: pathValue, pathParams, queryParams, requestBody, response }
}

/**
 * @param {any} ts
 * @param {any} expr
 * @param {any} sourceFile
 * @param {string} where
 * @returns {ApiField[]}
 */
function readParamsShape(ts, expr, sourceFile, where) {
  if (!expr) return []
  const typeNode = unwrapAssertionType(ts, expr, where)
  if (ts.isTypeLiteralNode(typeNode)) {
    return readMembers(ts, typeNode.members, sourceFile, where)
  }
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    throw new CliError(`${where}: use an inline object type for params (for example \`null as unknown as { id: string }\`).`)
  }
  throw new CliError(`${where}: params must be an object type.`)
}

/**
 * @param {any} ts
 * @param {any} expr
 * @param {string} where
 */
function unwrapAssertionType(ts, expr, where) {
  let node = expr
  while (ts.isParenthesizedExpression(node)) node = node.expression
  if (!ts.isAsExpression(node)) {
    throw new CliError(`${where} must be written as \`null as unknown as Type\`.`)
  }
  // Outermost assertion is the type we want: `null as unknown as Story[]` → Story[]
  return node.type
}

/**
 * @param {any} ts
 * @param {any} expr
 * @param {any} sourceFile
 * @param {string} where
 * @returns {ApiType}
 */
function readTypeAssertion(ts, expr, sourceFile, where) {
  const typeNode = unwrapAssertionType(ts, expr, where)
  return readTypeNode(ts, typeNode, sourceFile, where)
}

/**
 * @param {any} ts
 * @param {any} typeNode
 * @param {any} sourceFile
 * @param {string} where
 * @returns {ApiType}
 */
function readTypeNode(ts, typeNode, sourceFile, where) {
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return { kind: 'string' }
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return { kind: 'number' }
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return { kind: 'boolean' }
  if (ts.isArrayTypeNode(typeNode)) {
    return { kind: 'array', items: readTypeNode(ts, typeNode.elementType, sourceFile, `${where}[]`) }
  }
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    const name = typeNode.typeName.text
    if (name === 'Array' && typeNode.typeArguments?.length === 1) {
      return { kind: 'array', items: readTypeNode(ts, typeNode.typeArguments[0], sourceFile, `${where}[]`) }
    }
    if (name === 'Array') throw new CliError(`${where}: Array needs one type argument.`)
    assertTypeName(name, where)
    return { kind: 'ref', name }
  }
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    return { kind: 'enum', values: [typeNode.literal.text] }
  }
  if (ts.isUnionTypeNode(typeNode)) {
    const values = []
    for (const part of typeNode.types) {
      if (!ts.isLiteralTypeNode(part) || !ts.isStringLiteral(part.literal)) {
        throw new CliError(`${where}: unions must be string literals (for example "open" | "closed").`)
      }
      values.push(part.literal.text)
    }
    return { kind: 'enum', values }
  }
  if (ts.isTypeLiteralNode(typeNode)) {
    throw new CliError(`${where}: inline object types are only allowed for params. Give this shape a named interface.`)
  }
  throw new CliError(`${where}: use string, number, boolean, string unions, arrays, or a named model.`)
}

/** @param {string} name @param {string} where */
function assertTypeName(name, where) {
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new CliError(`${where}: "${name}" must be PascalCase letters and digits.`)
  }
}

/** @param {ApiType} type @param {string} where @param {Set<string>} modelNames */
function assertKnownTypes(type, where, modelNames) {
  if (type.kind === 'ref' && !modelNames.has(type.name)) {
    throw new CliError(`${where}: unknown model "${type.name}".`)
  }
  if (type.kind === 'array') assertKnownTypes(type.items, where, modelNames)
}

function openApiPath(pathValue) {
  return pathValue.replace(/:([A-Za-z][A-Za-z0-9]*)/g, '{$1}')
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
  return optional ? `${swiftType(type)}?` : swiftType(type)
}

/** @param {ApiContract} api */
function swiftModels(api) {
  const structs = api.models
    .map((model) => {
      const props = model.fields.map((field) => `    var ${field.name}: ${swiftFieldType(field.type, !field.required)}`).join('\n')
      return `nonisolated struct ${model.name}: Codable, Equatable, Sendable {\n${props}\n}`
    })
    .join('\n\n')
  return `// ${banner(SOURCE_DIR)}
import Foundation

${structs || '// No models declared.'}
`
}

/** @param {ApiOperation} op */
function swiftPathExpression(op) {
  let result = JSON.stringify(openApiPath(op.path))
  for (const param of op.pathParams) {
    result = `${result}.replacingOccurrences(of: "{${param.name}}", with: String(${param.name}))`
  }
  return result
}

/** @param {ApiOperation} op */
function swiftParamsList(op) {
  const parts = [...op.pathParams, ...op.queryParams].map((param) => `${param.name}: ${swiftFieldType(param.type, !param.required)}`)
  if (op.requestBody) parts.push(`body: ${swiftType(op.requestBody)}`)
  return parts.join(', ')
}

/** @param {ApiContract} api */
function swiftClient(api) {
  const methods = api.operations
    .map((op) => {
      const responseType = swiftType(op.response)
      const queryLines = op.queryParams
        .map((param) =>
          param.required
            ? `        items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name})))`
            : `        if let ${param.name} { items.append(URLQueryItem(name: ${JSON.stringify(param.name)}, value: String(${param.name}))) }`,
        )
        .join('\n')
      const bodyBlock =
        op.requestBody == null
          ? `        request.httpMethod = ${JSON.stringify(op.method)}\n`
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
      return `    static func ${op.id}(${swiftParamsList(op)}) async throws -> ${responseType} {
        let url = try makeURL(path: ${swiftPathExpression(op)}${queryArg})
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

  return `// ${banner(SOURCE_DIR)}
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
  return optional ? `${kotlinType(type)}?` : kotlinType(type)
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
      return `@Serializable\ndata class ${model.name}(\n${props}\n)`
    })
    .join('\n\n')
  return `// ${banner(SOURCE_DIR)}
package app.generated

import kotlinx.serialization.Serializable

${classes || '// No models declared.'}
`
}

/** @param {ApiOperation} op */
function kotlinParamsList(op) {
  const parts = [...op.pathParams, ...op.queryParams].map((param) => {
    const defaultValue = param.required ? '' : ' = null'
    return `${param.name}: ${kotlinFieldType(param.type, !param.required)}${defaultValue}`
  })
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
    .map((field) =>
      field.required
        ? `            ${field.name} = ${kotlinDecode(field.type, `obj.get("${field.name}")`)},`
        : `            ${field.name} = if (obj.isNull("${field.name}")) null else ${kotlinDecode(field.type, `obj.get("${field.name}")`)},`,
    )
    .join('\n')
  const encodeFields = model.fields
    .map((field) =>
      field.required
        ? `            put(${JSON.stringify(field.name)}, ${kotlinEncode(field.type, `value.${field.name}`)})`
        : `            if (value.${field.name} != null) put(${JSON.stringify(field.name)}, ${kotlinEncode(field.type, `value.${field.name}`)})`,
    )
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
      let pathExpr = JSON.stringify(openApiPath(op.path))
      for (const param of op.pathParams) {
        pathExpr = `${pathExpr}.replace("{${param.name}}", ${param.name}.toString())`
      }
      const queryBuilds = op.queryParams
        .map((param) =>
          param.required
            ? `        query += (if (query.isEmpty()) "?" else "&") + "${param.name}=" + java.net.URLEncoder.encode(${param.name}.toString(), Charsets.UTF_8.name())`
            : `        if (${param.name} != null) query += (if (query.isEmpty()) "?" else "&") + "${param.name}=" + java.net.URLEncoder.encode(${param.name}.toString(), Charsets.UTF_8.name())`,
        )
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
      return `    suspend fun ${op.id}(${kotlinParamsList(op)}): ${kotlinType(op.response)} = withContext(Dispatchers.IO) {
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

  return `// ${banner(SOURCE_DIR)}
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
function modelImportLines(api) {
  /** @type {Map<string, string[]>} */
  const byFile = new Map()
  for (const model of api.models) {
    const list = byFile.get(model.origin) ?? []
    list.push(model.name)
    byFile.set(model.origin, list)
  }
  return [...byFile.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([file, names]) => `import type { ${names.sort().join(', ')} } from "./${file.replace(/\.ts$/, '')}"`)
    .join('\n')
}

/** @param {ApiContract} api */
function typescriptClient(api) {
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
        pathExpr = `${pathExpr}.replaceAll(${JSON.stringify(':' + param.name)}, encodeURIComponent(String(${param.name})))`
      }
      const queryLines = op.queryParams
        .map((param) =>
          param.required
            ? `  query.set(${JSON.stringify(param.name)}, String(${param.name}))`
            : `  if (${param.name} !== undefined) query.set(${JSON.stringify(param.name)}, String(${param.name}))`,
        )
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

  const imports = [`import { AppConfig } from "../config"`, modelImportLines(api)].filter(Boolean).join('\n')

  return `// ${banner(SOURCE_DIR)}
${imports}

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

${methods || "/* No operations declared. */"}
`
}

/** @param {ApiContract} api */
function typescriptBarrel(api) {
  const copies = api.sources.map((file) => `export * from "./api/${file.name.replace(/\.ts$/, '')}"`).join('\n')
  return `// ${banner(SOURCE_DIR)}
${copies}
export * from "./api/client"
`
}
