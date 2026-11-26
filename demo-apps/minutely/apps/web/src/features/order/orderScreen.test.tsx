// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { renderApp, renderAppToString, testContainer } from '#/core/testing/testApp'
import { AppConfig } from '#/generated/config'
import { strings } from '#/generated/strings'
import { InMemoryOrdersRepository } from './InMemoryOrdersRepository'
import type { Order } from './Order'

const placed: Order = {
  id: 'MN123456',
  placedAt: 1761800123456,
  lines: [
    { productId: 'banana', name: 'Robusta Banana', unit: '6 pcs', emoji: '🍌', categoryId: 'fruits', price: 49, mrp: 60, quantity: 2 },
    { productId: 'milk', name: 'Toned Milk', unit: '500 ml', emoji: '🥛', categoryId: 'dairy', price: 28, mrp: 28, quantity: 1 },
  ],
  itemCount: 3,
  itemTotal: 126,
  savings: 22,
  deliveryFee: 25,
  toPay: 151,
}

const withOrder = () => testContainer({ ordersRepository: new InMemoryOrdersRepository([placed]) })

describe('Order placed screen', () => {
  test('AC-order-3: shows the order number, delivery time, each line and the total to pay', async () => {
    const app = await renderApp('/orders/MN123456', withOrder())
    expect(app.find('order.number')?.textContent).toBe(strings.orderNumber({ id: 'MN123456' }))
    expect(app.root.textContent).toContain(strings.orderPlacedBody({ minutes: AppConfig.deliveryMinutes }))
    expect(app.find('order.line.banana')?.textContent).toContain(strings.orderLineQuantity({ name: 'Robusta Banana', count: 2 }))
    expect(app.find('order.line.banana')?.textContent).toContain(strings.commonPrice({ amount: 98 }))
    expect(app.find('order.line.milk')?.textContent).toContain(strings.orderLineQuantity({ name: 'Toned Milk', count: 1 }))
    expect(app.find('order.total')?.textContent).toBe(strings.commonPrice({ amount: 151 }))
    app.unmount()
  })

  test('AC-order-3: the confirmed step is done, drawn with the check icon on a filled primary dot', async () => {
    const app = await renderApp('/orders/MN123456', withOrder())
    const confirmed = Array.from(app.root.querySelectorAll('li')).find((li) => li.textContent === strings.orderStepConfirmed)
    const dot = confirmed?.querySelector('span.bg-primary')
    expect(dot?.classList.contains('text-on-primary')).toBe(true)
    expect(dot?.querySelector('svg path')?.getAttribute('d')).toBe('M20 6 9 17l-5-5')
    app.unmount()
  })

  test('AC-order-4: an unknown order id shows the not-found state', async () => {
    const app = await renderApp('/orders/MN999999', withOrder())
    expect(app.find('order.notFound')?.textContent).toContain(strings.orderNotFoundTitle)
    expect(app.find('order.number')).toBeNull()
    app.unmount()
  })

  test('AC-order-4: before hydration the server shows nothing rather than the not-found state', async () => {
    const html = await renderAppToString('/orders/MN123456', withOrder())
    expect(html).not.toContain('data-testid="order.notFound"')
    expect(html).not.toContain('data-testid="order.number"')
  })

  test('AC-order-5: Continue shopping returns to Home', async () => {
    const app = await renderApp('/orders/MN123456', withOrder())
    await app.click('order.continueShopping')
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()

    const missing = await renderApp('/orders/MN000000', withOrder())
    await missing.click('order.continueShopping')
    expect(missing.router.state.location.pathname).toBe('/')
    missing.unmount()
  })
})
