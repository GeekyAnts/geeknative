import { describe, expect, test } from 'vitest'
import { LocalStorageOrdersRepository } from './LocalStorageOrdersRepository'
import { orderId, type Order } from './Order'
import { ORDERS_STORAGE_KEY } from './OrdersRepository'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

const order = (placedAt: number): Order => ({
  id: orderId(placedAt),
  placedAt,
  lines: [{ productId: 'milk', name: 'Toned Milk', unit: '500 ml', emoji: '🥛', categoryId: 'dairy', price: 28, mrp: 28, quantity: 1 }],
  itemCount: 1,
  itemTotal: 28,
  savings: 0,
  deliveryFee: 25,
  toPay: 53,
})

describe('Order', () => {
  test('AC-order-1: the id is MN and placedAt % 1000000, zero-padded to 6 digits', () => {
    expect(orderId(1761800123456)).toBe('MN123456')
    expect(orderId(1761800000042)).toBe('MN000042')
    expect(orderId(1761801000000)).toBe('MN000000')
  })

  test('AC-order-2: orders survive a restart under orders.history, newest first, at most 20', async () => {
    const storage = memoryStorage()
    const repository = new LocalStorageOrdersRepository(storage)
    for (let i = 1; i <= 22; i++) await repository.save(order(1761800000000 + i))

    const stored = JSON.parse(storage.values.get(ORDERS_STORAGE_KEY)!) as Order[]
    expect(stored).toHaveLength(20)
    expect(stored[0].id).toBe('MN000022')
    expect(stored[19].id).toBe('MN000003')
    expect(Object.keys(stored[0])).toEqual(['id', 'placedAt', 'lines', 'itemCount', 'itemTotal', 'savings', 'deliveryFee', 'toPay'])
    expect(Object.keys(stored[0].lines[0])).toEqual(['productId', 'name', 'unit', 'emoji', 'categoryId', 'price', 'mrp', 'quantity'])

    const restarted = new LocalStorageOrdersRepository(storage)
    expect(await restarted.order('MN000022')).toEqual(order(1761800000022))
    expect(await restarted.order('MN000001')).toBeUndefined()

    expect(await new LocalStorageOrdersRepository(memoryStorage({ [ORDERS_STORAGE_KEY]: 'garbage' })).order('MN000022')).toBeUndefined()
    expect(await new LocalStorageOrdersRepository(undefined).order('MN000022')).toBeUndefined()
  })
})
