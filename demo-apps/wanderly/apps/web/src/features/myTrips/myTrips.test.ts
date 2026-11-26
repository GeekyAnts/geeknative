import { describe, expect, test } from 'vitest'
import type { Trip } from '#/features/catalog/types'
import { LocalStorageTripRepository } from '#/features/tripPlanner/LocalStorageTripRepository'
import { tripSegment } from '#/features/tripPlanner/parseTrip'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

function trip(overrides: Partial<Trip>): Trip {
  return {
    id: 't1',
    destinationId: 'paris',
    title: 'Paris',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    travelers: 2,
    budgetBand: 'mid',
    interests: [],
    status: 'draft',
    days: [],
    ...overrides,
  }
}

describe('My trips', () => {
  test('AC-my-trips-1: trips are split into Upcoming, Past and Drafts using the status/date rules', () => {
    const today = '2026-12-05'
    expect(tripSegment(trip({ status: 'draft', endDate: '2026-12-10' }), today)).toBe('drafts')
    expect(tripSegment(trip({ status: 'upcoming', endDate: '2026-12-01' }), today)).toBe('past')
    expect(tripSegment(trip({ status: 'upcoming', endDate: '2026-12-10' }), today)).toBe('upcoming')
    expect(tripSegment(trip({ status: 'past', endDate: '2026-11-01' }), today)).toBe('past')
  })

  test('AC-my-trips-5: trips are still listed after an app restart', async () => {
    const storage = memoryStorage()
    await new LocalStorageTripRepository(storage).upsert(trip({ id: 'keep' }))
    const restarted = new LocalStorageTripRepository(storage)
    expect((await restarted.list()).map((entry) => entry.id)).toEqual(['keep'])
  })
})
