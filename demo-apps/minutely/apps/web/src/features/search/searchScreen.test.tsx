// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { renderApp } from '#/core/testing/testApp'
import { strings } from '#/generated/strings'

const productCards = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('[data-testid^="product."]')]
    .map((card) => card.dataset.testid)
    .filter((id) => id && /^product\.[a-z-]+$/.test(id))

describe('Search screen', () => {
  test('AC-search-1: opening Search with no query shows the prompt and no results', async () => {
    const app = await renderApp('/search')
    expect(app.find('search.prompt')?.textContent).toContain(strings.searchPromptTitle)
    expect(productCards(app.root)).toEqual([])
    expect(app.find('search.clear')).toBeNull()
    app.unmount()
  })

  test('AC-search-2: typing shows matches in catalog order and replaces the URL', async () => {
    const app = await renderApp(['/', '/search'])
    await app.type('search.field', 'choco')
    expect(productCards(app.root)).toEqual(['product.cookies', 'product.chocolate'])
    expect(app.router.state.location.search).toEqual({ q: 'choco' })

    // The query is replaced, not pushed, so Back leaves Search.
    app.router.history.back()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(app.router.state.location.pathname).toBe('/')
    app.unmount()
  })

  test('AC-search-3: a query with no matches shows the no-results state, naming the query', async () => {
    const app = await renderApp('/search?q=xyz')
    expect(app.find('search.empty')?.textContent).toContain(strings.searchNoResultsTitle({ query: 'xyz' }))
    await app.click('search.clear')
    expect(app.find('search.prompt')).not.toBeNull()
    expect(app.router.state.location.search).toEqual({})
    app.unmount()
  })

  test('AC-search-4: results show their count, and Add puts the product in the cart', async () => {
    const app = await renderApp('/search?q=choco')
    expect(app.find('search.resultCount')?.textContent).toBe(strings.searchResultCount(2))
    await app.click('product.chocolate.add')
    expect(await app.container.cartRepository.lines()).toEqual([{ productId: 'chocolate', quantity: 1 }])
    expect(app.find('product.chocolate.quantity')?.textContent).toBe('1')
    expect(app.find('cartBar')).not.toBeNull()
    app.unmount()
  })
})
