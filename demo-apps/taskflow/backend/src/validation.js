export const STATUSES = ['todo', 'inProgress', 'done']
export const PRIORITIES = ['low', 'medium', 'high']
export const TITLE_MAX = 120
export const NOTES_MAX = 2000

export class ValidationError extends Error {}

/** True for a real calendar date written as YYYY-MM-DD. @param {unknown} value */
export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/**
 * Checks a TaskInput body and returns it normalized (title and notes trimmed).
 * @param {unknown} body
 * @returns {import('./task-store.js').TaskInput}
 */
export function parseTaskInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('The body must be a JSON object.')
  }
  const { title, notes, status, priority, dueDate } = /** @type {Record<string, unknown>} */ (body)
  if (typeof title !== 'string' || !title.trim()) throw new ValidationError('title is required.')
  if (title.trim().length > TITLE_MAX) throw new ValidationError(`title must be at most ${TITLE_MAX} characters.`)
  if (typeof notes !== 'string') throw new ValidationError('notes must be a string (empty for none).')
  if (notes.trim().length > NOTES_MAX) throw new ValidationError(`notes must be at most ${NOTES_MAX} characters.`)
  const parsedStatus = parseStatus(status)
  if (typeof priority !== 'string' || !PRIORITIES.includes(priority)) {
    throw new ValidationError(`priority must be one of ${PRIORITIES.join(', ')}.`)
  }
  /** @type {import('./task-store.js').TaskInput} */
  const input = {
    title: title.trim(),
    notes: notes.trim(),
    status: parsedStatus,
    priority: /** @type {import('./task-store.js').TaskPriority} */ (priority),
  }
  if (dueDate !== undefined && dueDate !== null) {
    if (!isCalendarDate(dueDate)) throw new ValidationError('dueDate must be a calendar date like 2026-11-19.')
    input.dueDate = /** @type {string} */ (dueDate)
  }
  return input
}

/** @param {unknown} status @returns {import('./task-store.js').TaskStatus} */
export function parseStatus(status) {
  if (typeof status !== 'string' || !STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of ${STATUSES.join(', ')}.`)
  }
  return /** @type {import('./task-store.js').TaskStatus} */ (status)
}

/** @param {Record<string, unknown>} query */
export function parseListFilter(query) {
  /** @type {{ status?: import('./task-store.js').TaskStatus, priority?: import('./task-store.js').TaskPriority }} */
  const filter = {}
  if (query.status !== undefined) filter.status = parseStatus(query.status)
  if (query.priority !== undefined) {
    if (typeof query.priority !== 'string' || !PRIORITIES.includes(query.priority)) {
      throw new ValidationError(`priority must be one of ${PRIORITIES.join(', ')}.`)
    }
    filter.priority = /** @type {import('./task-store.js').TaskPriority} */ (query.priority)
  }
  return filter
}
