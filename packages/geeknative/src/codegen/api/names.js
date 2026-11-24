// @ts-check
import path from 'node:path'

/** Where the per-task API contracts live, relative to the project root. */
export const SOURCE = 'contracts/api'

/** `contracts/api/stories.json` → `stories`. Direct validateApi calls have no owner and use `api`. @param {string} [file] */
export function taskName(file) {
  return file ? path.basename(file, '.json') : 'api'
}

/** @param {string} task */
export function pascalTask(task) {
  return task
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** @param {string} task */
export const clientName = (task) => `Api${pascalTask(task)}`
