// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { destinations } from '#/features/catalog/WeddingCatalog'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { renderApp } from '#/testing/renderApp'

describe('Home', () => {
  test('AC-home-1: shows the app name as its title', async () => {
    const app = await renderApp('/')
    expect(app.element.querySelector('header a')?.textContent).toBe(AppIdentity.name)
    app.unmount()
  })

  test('AC-home-2: shows the hero title and supporting text', async () => {
    const app = await renderApp('/')
    expect(app.element.textContent).toContain(strings.homeHeroTitle)
    expect(app.element.textContent).toContain(strings.homeHeroBody)
    app.unmount()
  })

  test('AC-home-6: lists the featured destinations from the catalog', async () => {
    const app = await renderApp('/')
    for (const destination of destinations) {
      expect(app.element.querySelector(`[data-testid="home.destination.${destination.id}"]`)).not.toBeNull()
    }
    app.unmount()
  })
})
