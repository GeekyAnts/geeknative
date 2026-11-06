import { describe, expect, test } from 'vitest'
import { experiences } from '#/features/catalog/WeddingCatalog'
import { InMemoryWeddingRepository } from '#/features/wedding/InMemoryWeddingRepository'

describe('Experiences', () => {
  test('AC-experiences-1: Experiences shows every catalog service', () => {
    expect(experiences).toHaveLength(10)
    expect(experiences.map((item) => item.id)).toEqual([
      'photography',
      'florals',
      'catering',
      'planner',
      'makeup',
      'entertainment',
      'accommodation',
      'transport',
      'prewedding',
      'rituals',
    ])
  })

  test('AC-experiences-2: submitting a valid experience enquiry records it and selects that experience', async () => {
    const repository = new InMemoryWeddingRepository()
    await repository.addEnquiry({
      id: '1',
      venueId: '',
      experienceId: 'photography',
      coupleName: 'A & B',
      email: 'a@b.com',
      date: '',
      guests: 0,
      message: 'Please',
      createdAt: '2026-01-01',
    })
    const plan = await repository.getPlan()
    await repository.savePlan({ ...plan, selectedExperienceIds: ['photography'] })
    expect((await repository.getEnquiries())[0]?.experienceId).toBe('photography')
    expect((await repository.getPlan()).selectedExperienceIds).toContain('photography')
  })
})
