// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { click, renderApp } from '#/testing/renderApp'

describe('Site header', () => {
  test('drops a navigation panel from the compact menu control', async () => {
    const app = await renderApp('/')
    const toggle = app.element.querySelector('[data-testid="nav.menuToggle"]')
    const menu = app.element.querySelector('[data-testid="nav.menu"]')
    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(menu?.getAttribute('aria-hidden')).toBe('true')
    await click(toggle)
    expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    expect(menu?.getAttribute('aria-hidden')).toBe('false')
    expect(menu?.textContent).toContain(strings.navDestinations)
    expect(menu?.textContent).toContain(strings.navPlanCta)
    app.unmount()
  })
})
