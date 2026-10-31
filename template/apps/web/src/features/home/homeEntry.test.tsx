// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { click, renderApp } from '#/testing/renderApp'

describe('Home entry point', () => {
  test('AC-home-3: the Settings entry point opens Settings', async () => {
    const app = await renderApp('/')

    const entry = app.element.querySelector('[data-testid="home.openSettings"]')
    expect(entry?.getAttribute('aria-label')).toBe(strings.homeOpenSettings)
    await click(entry)

    expect(app.router.state.location.pathname).toBe('/settings')
    expect(app.element.textContent).toContain(strings.settingsTitle)
    app.unmount()
  })
})
