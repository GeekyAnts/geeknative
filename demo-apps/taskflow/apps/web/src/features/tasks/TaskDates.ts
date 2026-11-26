import type { TaskItem } from './Task'

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * A `YYYY-MM-DD` calendar date as local midnight. `new Date('2026-11-19')` would be UTC midnight,
 * which is the previous day west of Greenwich.
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The local calendar date of `date` as `YYYY-MM-DD`. */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `date` moved by whole calendar days, keeping local time. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Not Done, and due before today's local date. */
export function isOverdue(task: Pick<TaskItem, 'status' | 'dueDate'>, today: Date = new Date()): boolean {
  return task.status !== 'done' && task.dueDate !== undefined && task.dueDate < toLocalDateString(today)
}

/** A due date in the locale's medium style ("Nov 19, 2026"). */
export const formatMediumDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parseLocalDate(value))

/** A due date in the locale's long style ("November 19, 2026"). */
export const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(parseLocalDate(value))

/** A timestamp (ISO 8601) as a medium date and short time. */
export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
