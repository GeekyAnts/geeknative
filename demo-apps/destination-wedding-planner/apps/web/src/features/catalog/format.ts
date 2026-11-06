/** Formats a catalog USD amount for display. */
export function formatAmount(value: number): string {
  return `$${value.toLocaleString('en-US')}`
}

export function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/** Calendar days from today (UTC date) to an ISO yyyy-mm-dd, floored at 0. */
export function daysRemaining(date: string, today = new Date()): number {
  if (!date) return 0
  const target = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(target)) return 0
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.max(0, Math.round((target - start) / 86_400_000))
}
