import { describe, expect, test } from 'vitest'
import { destinations } from '#/features/catalog/WeddingCatalog'
import { filterDestinations } from '#/features/catalog/filters'
import { emptyWeddingPlan } from '#/features/catalog/types'
import { withToggledId } from '#/features/wedding/WeddingRepository'
import { InMemoryWeddingRepository } from '#/features/wedding/InMemoryWeddingRepository'

describe('Destinations', () => {
  test('AC-destinations-1: shows every catalog destination when no filter is applied', () => {
    expect(filterDestinations({ location: '', style: '', guests: 0, budget: 0 })).toHaveLength(destinations.length)
  })

  test('AC-destinations-2: choosing a style hides destinations that do not include that style', () => {
    const results = filterDestinations({ location: '', style: 'beach', guests: 0, budget: 0 })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((item) => item.styles.includes('beach'))).toBe(true)
    expect(results.some((item) => item.id === 'udaipur')).toBe(false)
  })

  test('AC-destinations-3: a guest count hides destinations whose maximum capacity is below it', () => {
    const results = filterDestinations({ location: '', style: '', guests: 300, budget: 0 })
    expect(results.every((item) => item.guestCapacityMax >= 300)).toBe(true)
    expect(results.some((item) => item.id === 'santorini')).toBe(false)
  })

  test('AC-destinations-5: saving a destination adds its id to the wedding plan', async () => {
    const repository = new InMemoryWeddingRepository()
    const plan = await repository.getPlan()
    await repository.savePlan({ ...plan, savedDestinationIds: withToggledId(plan.savedDestinationIds, 'udaipur') })
    expect((await repository.getPlan()).savedDestinationIds).toContain('udaipur')
    expect(emptyWeddingPlan.savedDestinationIds).toEqual([])
  })
})
