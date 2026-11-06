import { describe, expect, test } from 'vitest'
import { daysRemaining } from '#/features/catalog/format'
import { emptyWeddingPlan } from '#/features/catalog/types'
import { withToggledId } from './WeddingRepository'
import { InMemoryWeddingRepository } from './InMemoryWeddingRepository'

describe('Wedding', () => {
  test('AC-wedding-1: with a future date stored, shows the number of days remaining', () => {
    expect(daysRemaining('2026-11-16', new Date('2026-11-06T12:00:00Z'))).toBe(10)
    expect(daysRemaining('2026-11-06', new Date('2026-11-06T12:00:00Z'))).toBe(0)
  })

  test('AC-wedding-2: shows the selected destination and venue names when those ids are set', async () => {
    const repository = new InMemoryWeddingRepository({ ...emptyWeddingPlan, destinationId: 'udaipur', venueId: 'udaipur-taj-lake' })
    const plan = await repository.getPlan()
    expect(plan.destinationId).toBe('udaipur')
    expect(plan.venueId).toBe('udaipur-taj-lake')
  })

  test('AC-wedding-3: toggling a task persists it as completed after a reload', async () => {
    const repository = new InMemoryWeddingRepository()
    const first = await repository.getPlan()
    await repository.savePlan({ ...first, completedTaskIds: withToggledId(first.completedTaskIds, 'venue') })
    expect((await repository.getPlan()).completedTaskIds).toContain('venue')
  })

  test('AC-wedding-4: saved destinations on the plan appear in the saved list', async () => {
    const repository = new InMemoryWeddingRepository({ ...emptyWeddingPlan, savedDestinationIds: ['santorini'] })
    expect((await repository.getPlan()).savedDestinationIds).toEqual(['santorini'])
  })

  test('AC-wedding-5: changing guest count persists on the wedding plan', async () => {
    const repository = new InMemoryWeddingRepository()
    const plan = await repository.getPlan()
    await repository.savePlan({ ...plan, guestCount: 120 })
    expect((await repository.getPlan()).guestCount).toBe(120)
  })
})
