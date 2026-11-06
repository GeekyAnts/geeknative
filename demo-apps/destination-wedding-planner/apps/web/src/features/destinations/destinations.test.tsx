// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { click, renderApp } from '#/testing/renderApp'

describe('Destinations UI', () => {
  test('AC-destinations-4: opening a destination shows its name and description', async () => {
    const app = await renderApp('/destinations')
    await click(app.element.querySelector('[data-testid="destinations.card.udaipur"]'))
    expect(app.router.state.location.pathname).toBe('/destinations/udaipur')
    expect(app.element.textContent).toContain('Udaipur')
    expect(app.element.textContent).toMatch(/Lake Pichola/)
    app.unmount()
  })
})
