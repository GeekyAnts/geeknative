import { describe, expect, test } from 'vitest'
import { packages } from '#/features/catalog/WeddingCatalog'
import { budgetBreakdown } from '#/features/catalog/filters'
import { InMemoryWeddingRepository } from '#/features/wedding/InMemoryWeddingRepository'

describe('Packages', () => {
  test('AC-packages-1: shows Intimate, Grand, Royal Luxury and Bespoke', () => {
    expect(packages.map((item) => item.id)).toEqual(['intimate', 'grand', 'royal', 'bespoke'])
  })

  test('AC-packages-2: changing guest count updates the displayed total', () => {
    const pack = packages[0]
    const small = budgetBreakdown(pack, pack.includedGuests, [])
    const large = budgetBreakdown(pack, pack.includedGuests + 10, [])
    expect(large.total).toBe(small.total + 10 * pack.extraGuestPrice)
    expect(large.catering).toBeGreaterThan(small.catering)
  })

  test('AC-packages-3: selecting a package stores its id on the wedding plan', async () => {
    const repository = new InMemoryWeddingRepository()
    const plan = await repository.getPlan()
    await repository.savePlan({ ...plan, packageId: 'royal', budget: 280000 })
    expect((await repository.getPlan()).packageId).toBe('royal')
  })
})
