// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { TEST_NOW, renderApp, testContainer } from '#/core/testing/testApp'
import { InMemoryOrdersRepository } from '#/features/order/InMemoryOrdersRepository'
import { strings } from '#/generated/strings'
import { InMemoryCartRepository } from './InMemoryCartRepository'

const filledCart = () =>
  new InMemoryCartRepository([
    { productId: 'banana', quantity: 2 },
    { productId: 'milk', quantity: 1 },
  ])

describe('Cart screens', () => {
  test('AC-cart-5: the cart bar shows only with items, with the item count and total, and opens Cart', async () => {
    const empty = await renderApp('/')
    expect(empty.find('cartBar')).toBeNull()
    await empty.click('product.banana.add')
    expect(empty.find('cartBar')?.textContent).toContain(strings.commonItemCount(1))
    empty.unmount()

    for (const path of ['/', '/category/fruits', '/search?q=milk']) {
      const app = await renderApp(path, testContainer({ cartRepository: filledCart() }))
      const bar = app.find('cartBar')
      expect(bar?.textContent).toContain(strings.commonItemCount(3))
      expect(bar?.textContent).toContain(strings.commonPrice({ amount: 126 }))
      expect(bar?.textContent).toContain(strings.cartBarViewCart)
      app.unmount()
    }

    const app = await renderApp('/', testContainer({ cartRepository: filledCart() }))
    await app.click('cartBar')
    expect(app.router.state.location.pathname).toBe('/cart')
    app.unmount()
  })

  test('AC-cart-6: an empty Cart shows the empty state, and Start shopping returns to Home', async () => {
    const app = await renderApp('/cart')
    expect(app.find('cart.empty')?.textContent).toContain(strings.cartEmptyTitle)
    await app.click('cart.startShopping')
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()
  })

  test('AC-cart-6: removing the last line shows the empty state', async () => {
    const app = await renderApp('/cart', testContainer({ cartRepository: new InMemoryCartRepository([{ productId: 'milk', quantity: 1 }]) }))
    expect(app.find('cart.line.milk')).not.toBeNull()
    await app.click('product.milk.decrease')
    expect(app.find('cart.line.milk')).toBeNull()
    expect(app.find('cart.empty')).not.toBeNull()
    app.unmount()
  })

  test('AC-cart-4: the bill shows the item total, delivery fee, to pay and savings', async () => {
    const app = await renderApp('/cart', testContainer({ cartRepository: filledCart() }))
    const itemTotal = app.find('cart.itemTotal')
    expect(itemTotal?.textContent).toBe(strings.commonPrice({ amount: 126 }))
    // The struck MRP total follows the price (DESIGN.md: Money) and reads as common.mrp.
    expect(itemTotal?.nextElementSibling?.tagName).toBe('S')
    expect(itemTotal?.nextElementSibling?.textContent).toContain(strings.commonMrp({ amount: 148 }))
    expect(app.find('cart.deliveryFee')?.textContent).toBe(strings.commonPrice({ amount: 25 }))
    expect(app.find('cart.toPay')?.textContent).toBe(strings.commonPrice({ amount: 151 }))
    expect(app.find('cart.savings')?.textContent).toContain(strings.cartSavings({ amount: 22 }))
    expect(app.find('cart.freeDelivery')?.textContent).toContain(strings.cartFreeDeliveryNudge({ amount: 73 }))

    await app.click('product.milk.increase')
    await app.click('product.banana.increase')
    await app.click('product.banana.increase')
    // banana × 4 + milk × 2 = 196 + 56 = 252: free delivery.
    expect(app.find('cart.deliveryFee')?.textContent).toBe(strings.cartFree)
    expect(app.find('cart.freeDelivery')?.textContent).toContain(strings.cartFreeDeliveryUnlocked)
    app.unmount()
  })

  test('AC-cart-7: Place order saves the order, empties the cart and replaces Cart with Order placed', async () => {
    const cartRepository = filledCart()
    const ordersRepository = new InMemoryOrdersRepository()
    const app = await renderApp(['/', '/cart'], testContainer({ cartRepository, ordersRepository }))

    await app.click('cart.placeOrder')
    expect(app.router.state.location.pathname).toBe('/orders/MN123456')
    const order = await ordersRepository.order('MN123456')
    expect(order?.placedAt).toBe(TEST_NOW)
    expect(order?.lines.map((line) => [line.productId, line.quantity])).toEqual([
      ['banana', 2],
      ['milk', 1],
    ])
    expect(order?.toPay).toBe(151)
    expect(await cartRepository.lines()).toEqual([])
    expect(app.find('order.number')?.textContent).toBe(strings.orderNumber({ id: 'MN123456' }))
    expect(app.find('home.cartBadge')).toBeNull()

    // Order placed replaced Cart: Back returns to where the customer was before Cart.
    app.router.history.back()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()
  })
})
