import { describe, expect, test } from 'vitest'
import { venueById, venues } from '#/features/catalog/WeddingCatalog'
import { filterVenues } from '#/features/catalog/filters'
import { withToggledId } from '#/features/wedding/WeddingRepository'
import { InMemoryWeddingRepository } from '#/features/wedding/InMemoryWeddingRepository'

describe('Venues', () => {
  test('AC-venues-1: shows every catalog venue when no filter is applied', () => {
    expect(filterVenues({ destinationId: '', guests: 0, budget: 0 })).toHaveLength(venues.length)
  })

  test('AC-venues-2: filtering by destination shows only that destination\'s venues', () => {
    const results = filterVenues({ destinationId: 'udaipur', guests: 0, budget: 0 })
    expect(results.every((item) => item.destinationId === 'udaipur')).toBe(true)
    expect(results.map((item) => item.id)).toContain('udaipur-taj-lake')
  })

  test('AC-venues-3: venue detail shows capacity, from-price and amenities', () => {
    const venue = venueById('udaipur-taj-lake')
    expect(venue?.capacity).toBe(180)
    expect(venue?.priceFrom).toBe(120000)
    expect(venue?.amenities.length).toBeGreaterThan(0)
  })

  test('AC-venues-5: saving a venue adds its id to the wedding plan', async () => {
    const repository = new InMemoryWeddingRepository()
    const plan = await repository.getPlan()
    await repository.savePlan({ ...plan, savedVenueIds: withToggledId(plan.savedVenueIds, 'udaipur-taj-lake') })
    expect((await repository.getPlan()).savedVenueIds).toContain('udaipur-taj-lake')
  })
})
