import { beforeAll, describe, expect, test } from 'vitest'
import { renderAppToString } from '#/core/testing/testApp'
import { LocalCatalogRepository } from '#/features/catalog/LocalCatalogRepository'
import { AppIdentity } from '#/generated/app'
import { AppConfig } from '#/generated/config'
import { strings } from '#/generated/strings'

/** How React escapes text in server-rendered HTML. */
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

describe('Home, as rendered on the server', () => {
  let html = ''
  beforeAll(async () => {
    html = await renderAppToString('/')
  })
  const catalog = new LocalCatalogRepository()

  test('AC-home-1: shows the app name as its title', () => {
    expect(html).toMatch(new RegExp(`<h1[^>]*>${escapeHtml(AppIdentity.name)}</h1>`))
  })

  test('AC-home-2: shows the delivery promise with the delivery minutes and the address', () => {
    expect(html).toContain('data-testid="home.delivery"')
    expect(html).toContain(escapeHtml(strings.commonDeliveryIn({ minutes: AppConfig.deliveryMinutes })))
    expect(html).toContain(String(AppConfig.deliveryMinutes))
    expect(html).toContain(escapeHtml(strings.commonDeliveryAddress))
  })

  test('AC-home-4: shows all 6 categories', () => {
    for (const category of catalog.categories()) {
      expect(html).toContain(`data-testid="category.${category.id}"`)
      expect(html).toContain(escapeHtml(category.name))
    }
  })

  test('AC-home-5: shows the bestsellers as product cards', () => {
    const cards = [...html.matchAll(/data-testid="product\.([a-z-]+)"/g)].map((match) => match[1])
    expect(cards).toEqual(catalog.bestsellers().map((product) => product.id))
  })

  test('AC-cart-5: the server renders an empty cart, so no cart bar', () => {
    expect(html).not.toContain('data-testid="cartBar"')
  })
})
