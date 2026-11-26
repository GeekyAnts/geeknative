// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { change, click, renderApp, submit } from '#/testing/renderApp'

describe('Home', () => {
  test('AC-home-1: Home shows a destination search field', async () => {
    const app = await renderApp('/')
    const search = app.element.querySelector('[data-testid="home.search"]')
    expect(search).not.toBeNull()
    expect(search?.getAttribute('placeholder')).toBe(strings.homeSearchPlaceholder)
    app.unmount()
  })

  test("AC-home-2: Home shows the featured destination's photograph and name", async () => {
    const app = await renderApp('/')
    const featured = app.element.querySelector('[data-testid="home.featured"]')
    expect(featured?.textContent).toContain('Bali')
    expect(featured?.querySelector('img')?.getAttribute('alt')).toBe('Bali')
    app.unmount()
  })

  test('AC-home-3: tapping the featured destination or a trending destination opens City details', async () => {
    const app = await renderApp('/')
    await click(app.element.querySelector('[data-testid="home.featured"]'))
    expect(app.router.state.location.pathname).toBe('/city/bali')
    expect(app.element.querySelector('[data-testid="city.hero"]')?.textContent).toContain('Bali')
    app.unmount()

    const again = await renderApp('/')
    await click(again.element.querySelector('[data-testid="home.trending.paris"]'))
    expect(again.router.state.location.pathname).toBe('/city/paris')
    again.unmount()
  })

  test('AC-home-4: Home lists Paris, Bali, Tokyo, Dubai, London, Rome and Singapore as trending destinations, in that order', async () => {
    const app = await renderApp('/')
    const ids = [...app.element.querySelectorAll('[data-testid^="home.trending."]')]
      .map((node) => node.getAttribute('data-testid')?.replace('home.trending.', ''))
    expect(ids).toEqual(['paris', 'bali', 'tokyo', 'dubai', 'london', 'rome', 'singapore'])
    app.unmount()
  })

  test('AC-home-5: Home shows category chips for Beaches, Mountains, Adventure, History and Food', async () => {
    const app = await renderApp('/')
    expect(app.element.querySelector('[data-testid="home.category.beaches"]')?.textContent).toBe(strings.categoryBeaches)
    expect(app.element.querySelector('[data-testid="home.category.mountains"]')?.textContent).toBe(strings.categoryMountains)
    expect(app.element.querySelector('[data-testid="home.category.adventure"]')?.textContent).toBe(strings.categoryAdventure)
    expect(app.element.querySelector('[data-testid="home.category.history"]')?.textContent).toBe(strings.categoryHistory)
    expect(app.element.querySelector('[data-testid="home.category.food"]')?.textContent).toBe(strings.categoryFood)
    app.unmount()
  })

  test('AC-home-6: tapping a category opens Explore with that category selected', async () => {
    const app = await renderApp('/')
    await click(app.element.querySelector('[data-testid="home.category.beaches"]'))
    expect(app.router.state.location.pathname).toBe('/explore')
    expect(app.router.state.location.search).toEqual({ category: 'beaches' })
    app.unmount()
  })

  test('AC-home-7: Home shows popular attractions with photographs and names', async () => {
    const app = await renderApp('/')
    const eiffel = app.element.querySelector('[data-testid="home.popular.paris-eiffel"]')
    expect(eiffel?.textContent).toContain('Eiffel Tower')
    expect(eiffel?.querySelector('img')?.getAttribute('alt')).toBe('Eiffel Tower')
    app.unmount()
  })

  test('submitting search opens Explore with the query', async () => {
    const app = await renderApp('/')
    const input = app.element.querySelector('[data-testid="home.search"]')
    await change(input, '  Kyoto  ')
    await submit(input)
    expect(app.router.state.location.pathname).toBe('/explore')
    expect(app.router.state.location.search).toEqual({ q: 'Kyoto' })
    app.unmount()
  })
})
