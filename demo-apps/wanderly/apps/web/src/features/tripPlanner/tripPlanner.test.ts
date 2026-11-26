import { describe, expect, test } from 'vitest'
import { bundledCatalog } from '#/features/catalog/JsonCatalogRepository'
import { getDestination } from '#/features/catalog/lookups'
import { estimateBudget } from './budget'
import { addPlaceToDay, moveItem, removeItem, toggleComplete } from './editTrip'
import { generateTrip } from './generateTrip'
import { LocalStorageTripRepository } from './LocalStorageTripRepository'
import { tripSegment } from './parseTrip'
import type { Trip } from '#/features/catalog/types'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('Trip planner', () => {
  const paris = getDestination(bundledCatalog, 'paris')!

  test('AC-trip-planner-1: generate requires a destination, start date and end date', () => {
    expect(generateTrip({ destination: undefined, places: bundledCatalog.places, startDate: '2026-12-01', endDate: '2026-12-03', travelers: 2, budgetBand: 'mid', interests: [] }).ok).toBe(false)
    expect(generateTrip({ destination: paris, places: bundledCatalog.places, startDate: '', endDate: '2026-12-03', travelers: 2, budgetBand: 'mid', interests: [] }).ok).toBe(false)
    expect(generateTrip({ destination: paris, places: bundledCatalog.places, startDate: '2026-12-01', endDate: '', travelers: 2, budgetBand: 'mid', interests: [] }).ok).toBe(false)
  })

  test('AC-trip-planner-2: an end date before the start date does not create a trip', () => {
    const result = generateTrip({
      destination: paris,
      places: bundledCatalog.places,
      startDate: '2026-12-10',
      endDate: '2026-12-01',
      travelers: 2,
      budgetBand: 'mid',
      interests: [],
    })
    expect(result).toEqual({ ok: false, error: 'date' })
  })

  test('AC-trip-planner-3: generate creates one itinerary day per stay day (capped at 7), using the destination templates', () => {
    const result = generateTrip({
      destination: paris,
      places: bundledCatalog.places,
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      travelers: 2,
      budgetBand: 'mid',
      interests: [],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.trip.days).toHaveLength(7)
    expect(result.trip.startDate).toBe('2026-12-01')
    expect(result.trip.endDate).toBe('2026-12-10')
    expect(result.trip.status).toBe('draft')
    const templates = paris.itineraryTemplates
    expect(result.trip.days[0].items.map((item) => item.placeId)).toEqual(templates[0].items.map((item) => item.placeId))
    expect(result.trip.days[3].items.map((item) => item.placeId)).toEqual(templates[0].items.map((item) => item.placeId))
    expect(result.trip.days[0].date).toBe('2026-12-01')
    expect(result.trip.days[6].date).toBe('2026-12-07')
  })

  test('AC-trip-planner-7: the budget breakdown equals the lodging / food / activities formula', () => {
    const budget = estimateBudget(paris, 'mid', 3, 2)
    expect(budget.lodging).toBe(190 * 3)
    expect(budget.food).toBe(80 * 3 * 2)
    expect(budget.activities).toBe(60 * 3 * 2)
    expect(budget.total).toBe(budget.lodging + budget.food + budget.activities)
  })

  test('interests stable-sort matching categories first and never drop items', () => {
    const result = generateTrip({
      destination: paris,
      places: bundledCatalog.places,
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      travelers: 2,
      budgetBand: 'mid',
      interests: ['food'],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const ids = result.trip.days[0].items.map((item) => item.placeId)
    expect(ids).toHaveLength(3)
    expect(ids[0]).toBe('paris-flore')
  })

  test('AC-trip-planner-6: add, remove, reorder and complete persist after a restart', async () => {
    const storage = memoryStorage()
    const generated = generateTrip({
      destination: paris,
      places: bundledCatalog.places,
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      travelers: 2,
      budgetBand: 'mid',
      interests: [],
    })
    if (!generated.ok) throw new Error('generate')
    let trip: Trip = generated.trip
    const first = new LocalStorageTripRepository(storage)
    const itemId = trip.days[0].items[0].id
    const secondId = trip.days[0].items[1].id
    const thirdId = trip.days[0].items[2].id
    trip = toggleComplete(trip, itemId)
    trip = moveItem(trip, secondId, 'up')
    trip = removeItem(trip, thirdId)
    const marais = bundledCatalog.places.find((place) => place.id === 'paris-marais-walk')!
    trip = addPlaceToDay(trip, 1, marais)
    await first.upsert(trip)
    const restarted = new LocalStorageTripRepository(storage)
    const stored = await restarted.get(trip.id)
    expect(stored?.days[0].items.find((item) => item.id === itemId)?.completed).toBe(true)
    expect(stored?.days[0].items[0].id).toBe(secondId)
    expect(stored?.days[0].items.some((item) => item.id === thirdId)).toBe(false)
    expect(stored?.days[0].items.some((item) => item.placeId === 'paris-marais-walk')).toBe(true)
  })

  test('trips are split into upcoming, past and drafts using the status/date rules', () => {
    expect(tripSegment({ ...parisTrip(), status: 'draft' }, '2026-12-01')).toBe('drafts')
    expect(tripSegment({ ...parisTrip(), status: 'upcoming', endDate: '2026-11-01' }, '2026-12-01')).toBe('past')
    expect(tripSegment({ ...parisTrip(), status: 'upcoming', endDate: '2026-12-10' }, '2026-12-01')).toBe('upcoming')
  })
})

function parisTrip(): Trip {
  return {
    id: 't1',
    destinationId: 'paris',
    title: 'Paris',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    travelers: 2,
    budgetBand: 'mid',
    interests: [],
    status: 'upcoming',
    days: [],
  }
}
