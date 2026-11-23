// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { renderApp, testContainer } from '#/core/testing/testApp'
import { InMemoryCartRepository } from '#/features/cart/InMemoryCartRepository'
import { strings } from '#/generated/strings'

describe('Home entry points', () => {
  test('AC-home-3: the Settings entry point opens Settings', async () => {
    const app = await renderApp('/')
    expect(app.find('home.openSettings')?.getAttribute('aria-label')).toBe(strings.homeOpenSettings)
    await app.click('home.openSettings')
    expect(app.router.state.location.pathname).toBe('/settings')
    expect(app.root.textContent).toContain(strings.settingsTitle)
    app.unmount()
  })

  test('AC-home-4: choosing a category opens the Category screen for it', async () => {
    const app = await renderApp('/')
    expect(app.findAll('category.').map((tile) => tile.dataset.testid)).toEqual([
      'category.fruits',
      'category.dairy',
      'category.snacks',
      'category.drinks',
      'category.household',
      'category.personal',
    ])
    await app.click('category.snacks')
    expect(app.router.state.location.pathname).toBe('/category/snacks')
    expect(app.find('category.chip.snacks')?.getAttribute('aria-current')).toBe('page')
    app.unmount()
  })

  test('AC-home-6: the search entry opens Search', async () => {
    const app = await renderApp('/')
    await app.click('home.search')
    expect(app.router.state.location.pathname).toBe('/search')
    expect(app.find('search.field')).not.toBeNull()
    app.unmount()
  })

  test("AC-home-7: the Cart button opens Cart and its badge shows the cart's item count", async () => {
    const empty = await renderApp('/')
    expect(empty.find('home.openCart')?.getAttribute('aria-label')).toBe(strings.homeOpenCart)
    expect(empty.find('home.cartBadge')).toBeNull()
    empty.unmount()

    const cartRepository = new InMemoryCartRepository([
      { productId: 'banana', quantity: 2 },
      { productId: 'milk', quantity: 1 },
    ])
    const app = await renderApp('/', testContainer({ cartRepository }))
    expect(app.find('home.cartBadge')?.textContent).toBe('3')
    await app.click('product.banana.increase')
    expect(app.find('home.cartBadge')?.textContent).toBe('4')
    await app.click('home.openCart')
    expect(app.router.state.location.pathname).toBe('/cart')
    expect(app.find('cart.line.banana')).not.toBeNull()
    app.unmount()
  })
})
