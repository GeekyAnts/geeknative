import type { Order } from './Order'
import { ORDERS_STORAGE_KEY, parseOrders, withOrder, type OrdersRepository } from './OrdersRepository'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Keeps orders in the browser's localStorage under `orders.history`, newest first, at most 20. */
export class LocalStorageOrdersRepository implements OrdersRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  private read(): Order[] {
    try {
      return parseOrders(this.storage?.getItem(ORDERS_STORAGE_KEY))
    } catch {
      return []
    }
  }

  async save(order: Order): Promise<void> {
    this.storage?.setItem(ORDERS_STORAGE_KEY, JSON.stringify(withOrder(this.read(), order)))
  }

  async order(id: string): Promise<Order | undefined> {
    return this.read().find((order) => order.id === id)
  }
}
