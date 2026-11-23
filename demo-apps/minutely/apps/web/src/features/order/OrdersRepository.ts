import type { Order } from './Order'

/** Storage key, shared with the iOS and Android apps. */
export const ORDERS_STORAGE_KEY = 'orders.history'

/** How many orders are kept, newest first. */
export const MAX_STORED_ORDERS = 20

/** Stores placed orders. Screens use whichever implementation AppContainer provides. */
export interface OrdersRepository {
  save(order: Order): Promise<void>
  /** One order, or undefined. */
  order(id: string): Promise<Order | undefined>
}

/** Puts an order first (replacing one with the same id) and keeps the newest 20. */
export function withOrder(orders: readonly Order[], order: Order): Order[] {
  return [order, ...orders.filter((existing) => existing.id !== order.id)].slice(0, MAX_STORED_ORDERS)
}

const isOrder = (value: unknown): value is Order => {
  if (typeof value !== 'object' || value === null) return false
  const order = value as Record<string, unknown>
  return typeof order.id === 'string' && typeof order.placedAt === 'number' && Array.isArray(order.lines)
}

/** Reads stored orders. Unreadable data counts as no orders. */
export function parseOrders(json: string | null | undefined): Order[] {
  if (!json) return []
  try {
    const value: unknown = JSON.parse(json)
    return Array.isArray(value) ? value.filter(isOrder) : []
  } catch {
    return []
  }
}
