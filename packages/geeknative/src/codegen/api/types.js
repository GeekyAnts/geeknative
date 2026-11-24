// @ts-check
// Shared JSDoc types for the API contract model. No runtime code.

/**
 * @typedef {{ kind: 'string' | 'integer' | 'number' | 'boolean' }} ScalarType
 * @typedef {{ kind: 'enum', values: string[] }} EnumType
 * @typedef {{ kind: 'ref', name: string }} RefType
 * @typedef {{ kind: 'array', items: ApiType }} ArrayType
 * @typedef {{ kind: 'void' }} VoidType
 * @typedef {ScalarType | EnumType | RefType | ArrayType | VoidType} ApiType
 * @typedef {{ name: string, type: ApiType, required: boolean }} ApiField
 * @typedef {{ name: string, fields: ApiField[], task: string }} ApiModel
 * @typedef {{ name: string, in: 'path' | 'query', type: ApiType, required: boolean }} ApiParam
 * @typedef {{
 *   id: string,
 *   method: string,
 *   path: string,
 *   pathParams: ApiParam[],
 *   queryParams: ApiParam[],
 *   requestBody: ApiType | null,
 *   response: ApiType,
 *   task: string,
 * }} ApiOperation
 * @typedef {{ models: ApiModel[], operations: ApiOperation[] }} ApiContract
 */

export {}
