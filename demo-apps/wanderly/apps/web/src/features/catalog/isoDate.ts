const msPerDay = 86_400_000

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addUtcDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return formatIsoDate(date)
}

export function inclusiveDayCount(startDate: string, endDate: string): number {
  return Math.round((parseIsoDate(endDate).getTime() - parseIsoDate(startDate).getTime()) / msPerDay) + 1
}

export function itineraryDayCount(startDate: string, endDate: string): number {
  return Math.min(Math.max(inclusiveDayCount(startDate, endDate), 1), 7)
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseIsoDate(iso))
}
