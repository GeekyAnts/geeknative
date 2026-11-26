// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { change, click, renderApp } from '#/testing/renderApp'

describe('Explore', () => {
  test('AC-explore-1: typing a query shows destinations and places whose names match', async () => {
    const app = await renderApp('/explore')
    await change(app.element.querySelector('[data-testid="explore.search"]'), 'Eiffel')
    expect(app.element.querySelector('[data-testid="explore.place.paris-eiffel"]')?.textContent).toContain('Eiffel Tower')
    app.unmount()
  })

  test('AC-explore-2: choosing a category shows only destinations tagged with that category', async () => {
    const app = await renderApp('/explore')
    await click(app.element.querySelector('[data-testid="explore.category.beaches"]'))
    expect(app.element.querySelector('[data-testid="explore.destination.bali"]')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="explore.destination.paris"]')).toBeNull()
    app.unmount()
  })

  test('AC-explore-3: tapping a destination opens City details', async () => {
    const app = await renderApp('/explore')
    await click(app.element.querySelector('[data-testid="explore.destination.paris"]'))
    expect(app.router.state.location.pathname).toBe('/city/paris')
    app.unmount()
  })

  test('AC-explore-4: with no query and no category, Explore shows the full destination grid', async () => {
    const app = await renderApp('/explore')
    expect(app.element.querySelector('[data-testid="explore.destination.paris"]')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="explore.destination.bali"]')).not.toBeNull()
    expect(app.element.querySelector('[data-testid="explore.destination.kyoto"]')).not.toBeNull()
    app.unmount()
  })

  test('AC-explore-5: a query with no matches shows the empty state', async () => {
    const app = await renderApp('/explore')
    await change(app.element.querySelector('[data-testid="explore.search"]'), 'zzzz-no-such-place')
    expect(app.element.querySelector('[data-testid="explore.empty"]')?.textContent).toContain(strings.exploreEmptyTitle)
    app.unmount()
  })
})
