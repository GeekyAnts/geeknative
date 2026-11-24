// @ts-check
import { banner } from '../util.js'
import { SOURCE } from './names.js'

/** @typedef {import('./types.js').ApiType} ApiType */
/** @typedef {import('./types.js').ApiModel} ApiModel */
/** @typedef {import('./types.js').ApiOperation} ApiOperation */
/** @typedef {import('./types.js').ApiContract} ApiContract */

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
    case 'void':
      return 'void'
  }
}

/** @param {string} id */
function argsTypeName(id) {
  return `${id[0].toUpperCase()}${id.slice(1)}Args`
}

export function tsTransport() {
  return `// ${banner(SOURCE)}
import { AppConfig } from "../config"

export class ApiError extends Error {
  readonly status: number
  readonly body: string
  constructor(status: number, body: string) {
    super(\`HTTP \${status}: \${body}\`)
    this.status = status
    this.body = body
  }
}

export function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : \`\${value}/\`
}

export function apiBaseUrl(): string {
  return ensureTrailingSlash(String(AppConfig.apiBaseUrl))
}
`
}

/**
 * Types this task uses that live in another task file.
 * @param {ApiContract & { task: string }} slice
 * @param {ApiModel[]} allModels
 */
function tsTypeImports(slice, allModels) {
  const local = new Set(slice.models.map((model) => model.name))
  /** @type {Map<string, Set<string>>} */
  const byTask = new Map()
  /** @param {ApiType | null | undefined} type */
  const walk = (type) => {
    if (!type) return
    if (type.kind === 'array') walk(type.items)
    if (type.kind === 'ref' && !local.has(type.name)) {
      const owner = allModels.find((model) => model.name === type.name)?.task
      if (!owner || owner === slice.task) return
      const names = byTask.get(owner) ?? new Set()
      names.add(type.name)
      byTask.set(owner, names)
    }
  }
  for (const model of slice.models) for (const field of model.fields) walk(field.type)
  for (const op of slice.operations) {
    walk(op.response)
    walk(op.requestBody)
    for (const param of [...op.pathParams, ...op.queryParams]) walk(param.type)
  }
  return [...byTask.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([task, names]) => `import type { ${[...names].sort().join(', ')} } from "./${task}"`)
    .join('\n')
}

/** @param {ApiContract & { task: string }} slice @param {ApiModel[]} allModels @param {boolean} includeClient */
export function tsTask(slice, allModels, includeClient) {
  const api = slice
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
  const url = new URL(path.replace(/^\\//, ""), apiBaseUrl())
  url.search = query.toString()
  const response = await fetch(url, {
    ...init,
    method: ${JSON.stringify(op.method)},
${fetchBody}
  })
  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }
  ${
    op.response.kind === 'void'
      ? 'return'
      : `return (await response.json()) as ${tsType(op.response)}`
  }
}`
    })
    .join('\n\n')

  const typesBlock = interfaces
  const typeImports = tsTypeImports(slice, allModels)
  const clientImports = includeClient ? `import { ApiError, apiBaseUrl } from "./transport"` : ''
  const imports = [clientImports, typeImports].filter(Boolean).join('\n')
  return `// ${banner(SOURCE)}
${imports ? `${imports}\n\n` : ''}${[typesBlock, includeClient ? methods : ''].filter(Boolean).join('\n\n')}
`
}
