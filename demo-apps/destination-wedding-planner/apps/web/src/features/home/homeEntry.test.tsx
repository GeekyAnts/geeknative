// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { click, renderApp, submit } from '#/testing/renderApp'

describe('Home entry points', () => {
  test('AC-home-3: the Settings entry point opens Settings', async () => {
    const app = await renderApp('/')
    const entry = app.element.querySelector('[data-testid="home.openSettings"]')
    expect(entry?.getAttribute('aria-label')).toBe(strings.homeOpenSettings)
    await click(entry)
    expect(app.router.state.location.pathname).toBe('/settings')
    expect(app.element.textContent).toContain(strings.settingsTitle)
    app.unmount()
  })

  test('AC-home-4: Explore Destinations opens Destinations', async () => {
    const app = await renderApp('/')
    await click(app.element.querySelector('[data-testid="home.exploreCta"]'))
    expect(app.router.state.location.pathname).toBe('/destinations')
    expect(app.element.textContent).toContain(strings.destinationsTitle)
    app.unmount()
  })

  test('AC-home-5: Plan Your Wedding opens Wedding', async () => {
    const app = await renderApp('/')
    await click(app.element.querySelector('[data-testid="home.planCta"]'))
    expect(app.router.state.location.pathname).toBe('/wedding')
    expect(app.element.textContent).toContain(strings.weddingTitle)
    app.unmount()
  })

  test('AC-home-7: submitting the search panel opens Destinations', async () => {
    const app = await renderApp('/')
    await submit(app.element.querySelector('[data-testid="home.search"] form'))
    expect(app.router.state.location.pathname).toBe('/destinations')
    app.unmount()
  })
})
