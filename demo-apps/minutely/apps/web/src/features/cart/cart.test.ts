import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test } from 'vitest'
import { TEST_NOW } from '#/core/testing/testApp'
import { LocalCatalogRepository } from '#/features/catalog/LocalCatalogRepository'
import { InMemoryOrdersRepository } from '#/features/order/InMemoryOrdersRepository'
import { CART_STORAGE_KEY, type CartLine } from './CartRepository'
import { cartSummary } from './CartSummary'
import { InMemoryCartRepository } from './InMemoryCartRepository'
import { LocalStorageCartRepository } from './LocalStorageCartRepository'
import { cartQuery } from './useCart'
import { placeOrder } from './useCartViewModel'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

const catalog = new LocalCatalogRepository()
const product = (id: string) => catalog.product(id)
// The worked example in spec/features/cart.md uses threshold 199 and fee 25.
const pricing = { freeDeliveryThreshold: 199, deliveryFee: 25 }
const example: CartLine[] = [
  { productId: 'banana', quantity: 2 },
  { productId: 'milk', quantity: 1 },
]

describe('Cart', () => {
  test.each([
    ['InMemoryCartRepository', () => new InMemoryCartRepository()],
    ['LocalStorageCartRepository', () => new LocalStorageCartRepository(memoryStorage(), catalog)],
  ])('AC-cart-1: add appends or increases, remove decreases and drops the line at 0 (%s)', async (_, make) => {
    const cart = make()
    expect(await cart.add('banana')).toEqual([{ productId: 'banana', quantity: 1 }])
    await cart.add('milk')
    expect(await cart.add('banana')).toEqual([
      { productId: 'banana', quantity: 2 },
      { productId: 'milk', quantity: 1 },
    ])
    expect(await cart.quantity('banana')).toBe(2)
    expect(await cart.remove('banana')).toEqual([
      { productId: 'banana', quantity: 1 },
      { productId: 'milk', quantity: 1 },
    ])
    expect(await cart.remove('banana')).toEqual([{ productId: 'milk', quantity: 1 }])
    expect(await cart.quantity('banana')).toBe(0)
    expect(await cart.remove('apple')).toEqual([{ productId: 'milk', quantity: 1 }])
    expect(await cart.clear()).toEqual([])
  })

  test('AC-cart-2: the cart survives a restart under cart.items, dropping unknown, invalid and unreadable data', async () => {
    const storage = memoryStorage()
    const cart = new LocalStorageCartRepository(storage, catalog)
    await cart.add('banana')
    await cart.add('banana')
    await cart.add('milk')
    expect(storage.values.get(CART_STORAGE_KEY)).toBe('[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1}]')
    expect(await new LocalStorageCartRepository(storage, catalog).lines()).toEqual(example)

    const stored = (json: string) => new LocalStorageCartRepository(memoryStorage({ [CART_STORAGE_KEY]: json }), catalog).lines()
    expect(
      await stored('[{"productId":"unicorn","quantity":1},{"productId":"milk","quantity":0},{"productId":"eggs","quantity":-2},{"productId":"bread","quantity":3}]'),
    ).toEqual([{ productId: 'bread', quantity: 3 }])
    expect(await stored('not json')).toEqual([])
    expect(await stored('{"productId":"milk"}')).toEqual([])
    expect(await new LocalStorageCartRepository(undefined, catalog).lines()).toEqual([])
  })

  test('AC-cart-2: duplicate lines for one product are merged by adding quantities', async () => {
    const stored = (json: string) => new LocalStorageCartRepository(memoryStorage({ [CART_STORAGE_KEY]: json }), catalog).lines()
    expect(
      await stored('[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1},{"productId":"banana","quantity":1}]'),
    ).toEqual([
      { productId: 'banana', quantity: 3 },
      { productId: 'milk', quantity: 1 },
    ])
    // Invalid lines are dropped before merging, so they neither add to nor position a product.
    expect(
      await stored('[{"productId":"milk","quantity":0},{"productId":"bread","quantity":1},{"productId":"milk","quantity":2},{"productId":"bread","quantity":2}]'),
    ).toEqual([
      { productId: 'bread', quantity: 3 },
      { productId: 'milk', quantity: 2 },
    ])
  })

  test('AC-cart-3: itemCount, itemTotal, mrpTotal and savings follow the rules', () => {
    const summary = cartSummary(example, product, pricing)
    expect(summary.itemCount).toBe(3)
    expect(summary.itemTotal).toBe(126)
    expect(summary.mrpTotal).toBe(148)
    expect(summary.savings).toBe(22)
  })

  test('AC-cart-4: delivery is free at or above the threshold; toPay and amountToFreeDelivery follow the rules', () => {
    const below = cartSummary(example, product, pricing)
    expect(below.deliveryFee).toBe(25)
    expect(below.toPay).toBe(151)
    expect(below.amountToFreeDelivery).toBe(73)

    const above = cartSummary([...example, { productId: 'detergent', quantity: 1 }], product, pricing)
    expect(above.itemTotal).toBe(325)
    expect(above.deliveryFee).toBe(0)
    expect(above.toPay).toBe(325)
    expect(above.amountToFreeDelivery).toBe(0)

    // Exactly at the threshold is free; an empty cart has no fee.
    expect(cartSummary([{ productId: 'detergent', quantity: 1 }], product, pricing).deliveryFee).toBe(0)
    expect(cartSummary([], product, pricing)).toEqual({
      itemCount: 0, itemTotal: 0, mrpTotal: 0, savings: 0, deliveryFee: 0, toPay: 0, amountToFreeDelivery: 199,
    })
  })

  test("AC-cart-7: placing an order saves the cart's lines and totals and empties the cart", async () => {
    const queryClient = new QueryClient()
    const cartRepository = new InMemoryCartRepository(example)
    const ordersRepository = new InMemoryOrdersRepository()
    const order = await placeOrder(queryClient, { cartRepository, catalogRepository: catalog, ordersRepository, clock: () => TEST_NOW })

    expect(order).toEqual({
      id: 'MN123456',
      placedAt: TEST_NOW,
      lines: [
        { productId: 'banana', name: 'Robusta Banana', unit: '6 pcs', emoji: '🍌', categoryId: 'fruits', price: 49, mrp: 60, quantity: 2 },
        { productId: 'milk', name: 'Toned Milk', unit: '500 ml', emoji: '🥛', categoryId: 'dairy', price: 28, mrp: 28, quantity: 1 },
      ],
      itemCount: 3,
      itemTotal: 126,
      savings: 22,
      deliveryFee: 25,
      toPay: 151,
    })
    expect(await ordersRepository.order('MN123456')).toEqual(order)
    expect(await cartRepository.lines()).toEqual([])
    // Every screen sees the empty cart at once.
    expect(queryClient.getQueryData(cartQuery(cartRepository).queryKey)).toEqual([])
  })
})
