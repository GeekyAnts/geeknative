// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { renderApp } from '#/core/testing/testApp'
import { strings } from '#/generated/strings'

const productIds = (cards: HTMLElement[]) =>
  cards.map((card) => card.dataset.testid).filter((id) => id && /^product\.[a-z-]+$/.test(id))

describe('Category screen', () => {
  test("AC-catalog-4: lists exactly the chosen category's products, and a chip switches category", async () => {
    const app = await renderApp(['/', '/category/dairy'])
    expect(app.root.querySelector('h1')?.textContent).toBe('Dairy, Bread & Eggs')
    expect(productIds(app.findAll('product.'))).toEqual(['product.milk', 'product.eggs', 'product.bread', 'product.cheese', 'product.butter'])

    await app.click('category.chip.snacks')
    expect(app.router.state.location.pathname).toBe('/category/snacks')
    expect(productIds(app.findAll('product.'))).toEqual([
      'product.chips', 'product.popcorn', 'product.cookies', 'product.chocolate', 'product.pretzels',
    ])
    expect(app.find('category.chip.snacks')?.getAttribute('aria-current')).toBe('page')
    expect(app.find('category.chip.dairy')?.getAttribute('aria-current')).toBeNull()

    // Chips switch the screen without pushing a new one: Back leaves the Category screen.
    app.router.history.back()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()
  })

  test('AC-catalog-4: an unknown category id shows the first category', async () => {
    const app = await renderApp('/category/unknown')
    expect(productIds(app.findAll('product.'))).toEqual([
      'product.banana', 'product.apple', 'product.tomato', 'product.avocado', 'product.carrot',
    ])
    app.unmount()
  })

  test('AC-catalog-2: a discounted card shows the price first, then the struck MRP read as common.mrp', async () => {
    const app = await renderApp('/category/fruits')
    const struck = app.find('product.banana')?.querySelector('s')
    expect(struck?.previousElementSibling?.textContent).toBe(strings.commonPrice({ amount: 49 }))
    expect(struck?.textContent).toContain(strings.commonMrp({ amount: 60 }))
    app.unmount()
  })

  test('AC-catalog-5: Add puts one in the cart and the card then shows the stepper with quantity 1', async () => {
    const app = await renderApp('/category/fruits')
    const add = app.find('product.apple.add')
    expect(add?.textContent).toBe(strings.commonAdd)
    expect(add?.getAttribute('aria-label')).toBe(strings.commonAddItem({ name: 'Shimla Apple' }))

    await app.click('product.apple.add')
    expect(await app.container.cartRepository.lines()).toEqual([{ productId: 'apple', quantity: 1 }])
    expect(app.find('product.apple.add')).toBeNull()
    expect(app.find('product.apple.quantity')?.textContent).toBe('1')
    // The count's accessible value is common.inCart; the bare number is hidden from assistive technology.
    expect(app.find('product.apple.quantity')?.getAttribute('aria-hidden')).toBe('true')
    expect(app.find('product.apple.quantity')?.nextElementSibling?.textContent).toBe(strings.commonInCart(1))
    expect(app.find('product.apple.increase')?.getAttribute('aria-label')).toBe(strings.commonIncrease({ name: 'Shimla Apple' }))

    await app.click('product.apple.decrease')
    expect(app.find('product.apple.add')).not.toBeNull()
    expect(await app.container.cartRepository.lines()).toEqual([])
    app.unmount()
  })
})
