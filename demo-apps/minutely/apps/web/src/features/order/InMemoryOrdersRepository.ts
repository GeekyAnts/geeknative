import type { Order } from './Order'
import { withOrder, type OrdersRepository } from './OrdersRepository'

/** Keeps orders in memory only. For tests and previews: nothing survives a restart. */
export class InMemoryOrdersRepository implements OrdersRepository {
  private orders: Order[]

  constructor(orders: Order[] = []) {
    this.orders = [...orders]
  }

  async save(order: Order): Promise<void> {
    this.orders = withOrder(this.orders, order)
  }

  async order(id: string): Promise<Order | undefined> {
    return this.orders.find((order) => order.id === id)
  }
}
