// @ts-check
// Entry point for the API contract pipeline. The work lives in ./api/:
//   names.js     SOURCE and task naming
//   load.js      read contracts/api/*.json and merge the task files
//   validate.js  check the OpenAPI subset and build the contract model
//   swift.js, kotlin.js, ts.js   one emitter per platform
import { OUT } from './util.js'
import { kotlinTask, kotlinTransport } from './api/kotlin.js'
import { pascalTask } from './api/names.js'
import { swiftTask, swiftTransport } from './api/swift.js'
import { tsTask, tsTransport } from './api/ts.js'

export { mergeApiSlices, readApi } from './api/load.js'
export { validateApi } from './api/validate.js'

/** @typedef {import('./api/types.js').ApiContract} ApiContract */

/**
 * @param {ApiContract} api
 * @param {{ includeClient?: boolean }} [opts]
 * Models always. HTTP client files only when `apiBaseUrl` is in config (a hosted backend).
 */
export function apiOutputs(api, { includeClient = false } = {}) {
  const tasks = [
    ...new Set([...api.models.map((model) => model.task), ...api.operations.map((op) => op.task)]),
  ].sort()
  /** @type {{ path: string, content: string | Buffer, local?: boolean }[]} */
  const files = []
  const transport = includeClient && api.operations.length > 0
  if (transport) {
    files.push(
      { path: `${OUT.iosGenerated}/api/ApiTransport.swift`, content: swiftTransport() },
      { path: `${OUT.androidKotlin}/api/ApiTransport.kt`, content: kotlinTransport() },
      { path: `${OUT.webGenerated}/api/transport.ts`, content: tsTransport() },
    )
  }
  for (const task of tasks) {
    const slice = {
      task,
      models: api.models.filter((model) => model.task === task),
      operations: api.operations.filter((op) => op.task === task),
    }
    const withClient = transport && slice.operations.length > 0
    files.push(
      { path: `${OUT.iosGenerated}/api/${pascalTask(task)}.swift`, content: swiftTask(slice, withClient) },
      { path: `${OUT.androidKotlin}/api/${pascalTask(task)}.kt`, content: kotlinTask(slice, withClient) },
      { path: `${OUT.webGenerated}/api/${task}.ts`, content: tsTask(slice, api.models, withClient) },
    )
  }
  return files
}
