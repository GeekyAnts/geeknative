import { describe, expect, test } from 'vitest'
import { bundledCatalog } from '#/features/catalog/JsonCatalogRepository'
import { searchCatalog } from './searchCatalog'

describe('Explore search', () => {
  test('AC-explore-1: typing a query shows destinations and places whose names match', () => {
    const { destinations, places } = searchCatalog(bundledCatalog, { q: 'eiffel' })
    expect(destinations.map((destination) => destination.id)).not.toContain('paris')
    expect(places.map((place) => place.id)).toContain('paris-eiffel')
    const kyoto = searchCatalog(bundledCatalog, { q: 'Kyoto' })
    expect(kyoto.destinations.map((destination) => destination.id)).toContain('kyoto')
  })

  test('AC-explore-2: choosing a category shows only destinations and places tagged with that category', () => {
    const { destinations, places } = searchCatalog(bundledCatalog, { category: 'beaches' })
    expect(destinations.every((destination) => destination.categories.includes('beaches'))).toBe(true)
    expect(places.every((place) => place.category === 'beaches')).toBe(true)
    expect(destinations.map((destination) => destination.id)).toContain('bali')
  })

  test('AC-explore-4: with no query and no category, Explore shows the full destination grid', () => {
    const { destinations } = searchCatalog(bundledCatalog, {})
    expect(destinations.map((destination) => destination.id)).toEqual(
      bundledCatalog.destinations.map((destination) => destination.id),
    )
  })

  test('AC-explore-5: a query with no matches is empty', () => {
    const { destinations, places } = searchCatalog(bundledCatalog, { q: 'zzzz-no-such-place' })
    expect(destinations).toEqual([])
    expect(places).toEqual([])
  })
})
