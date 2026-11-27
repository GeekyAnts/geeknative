/** Device preference. `on` shows OS delivery; `off` keeps the inbox quiet. */
export const NOTIFICATIONS_ENABLED_KEY = 'notifications.enabled'

/** JSON array of notifications. The same key and shape on every platform. */
export const NOTIFICATIONS_INBOX_KEY = 'notifications.inbox'

export type AppNotification = {
  id: string
  kind: string
  title: string
  body: string
  createdAt: string
  readAt: string | null
  route: string | null
  routeParams: Record<string, string>
  deliverAt: string | null
  deliveredAt: string | null
}

export function parseEnabled(stored: string | null | undefined): boolean {
  return stored === 'on'
}

export function enabledValue(enabled: boolean): 'on' | 'off' {
  return enabled ? 'on' : 'off'
}

/** Unread first, then newest `createdAt`. ISO-8601 UTC strings sort lexicographically. */
export function sortInbox(items: AppNotification[]): AppNotification[] {
  return [...items].sort((a, b) => {
    const unread = Number(b.readAt === null) - Number(a.readAt === null)
    if (unread !== 0) return unread
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
  })
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).every((entry) => typeof entry === 'string')
}

function parseOne(value: unknown): AppNotification | null {
  if (value === null || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const text = (key: string) => (typeof row[key] === 'string' ? (row[key] as string) : null)
  const id = text('id')
  const kind = text('kind')
  const title = text('title')
  const body = text('body')
  const createdAt = text('createdAt')
  if (!id || !kind || title === null || body === null || !createdAt) return null
  const routeParams = row.routeParams === undefined ? {} : row.routeParams
  if (!isStringRecord(routeParams)) return null
  return {
    id,
    kind,
    title,
    body,
    createdAt,
    readAt: text('readAt'),
    route: text('route'),
    routeParams,
    deliverAt: text('deliverAt'),
    deliveredAt: text('deliveredAt'),
  }
}

export function decodeInbox(raw: string | null | undefined): AppNotification[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const notification = parseOne(item)
      return notification ? [notification] : []
    })
  } catch {
    return []
  }
}

export function encodeInbox(items: AppNotification[]): string {
  return JSON.stringify(items)
}

/**
 * Notifications whose `deliverAt` has passed and that have not been handed to the OS yet.
 * Returns the inbox with `deliveredAt` set, and the ones to present. Disabled means nothing is presented.
 */
export function dueDeliveries(
  items: AppNotification[],
  enabled: boolean,
  now: string,
): { inbox: AppNotification[]; present: AppNotification[] } {
  if (!enabled) return { inbox: items, present: [] }
  const present: AppNotification[] = []
  const inbox = items.map((item) => {
    if (!item.deliverAt || item.deliveredAt || item.deliverAt > now) return item
    const delivered = { ...item, deliveredAt: now }
    present.push(delivered)
    return delivered
  })
  return { inbox, present }
}
