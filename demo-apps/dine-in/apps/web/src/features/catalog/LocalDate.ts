import { weekdays, type Weekday } from './Catalog'

/** Calendar dates and wall-clock times in the device's local time, as "yyyy-MM-dd" and "HH:mm". */

const pad = (value: number) => String(value).padStart(2, '0')

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local midnight of a "yyyy-MM-dd" date. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

/** Minutes after midnight of "HH:mm". */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** "HH:mm" of minutes after midnight, wrapping past midnight (24:30 → 00:30). */
export function timeOf(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`
}

/** The local date-time of a date plus minutes after its midnight (which may run into the next day). */
export function dateAt(date: string, minutes: number): Date {
  const result = parseIsoDate(date)
  result.setMinutes(minutes)
  return result
}

export function dateTimeOf(date: string, time: string): Date {
  return dateAt(date, minutesOf(time))
}

/** The weekday key (`mon`…`sun`) of a date. */
export function weekdayOf(date: string): Weekday {
  return weekdays[(parseIsoDate(date).getDay() + 6) % 7]
}

/** ISO 8601 in UTC with `Z`, as stored in data. */
export function isoTimestamp(date: Date): string {
  return date.toISOString()
}
