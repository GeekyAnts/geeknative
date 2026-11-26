import { createId } from '#/features/catalog/createId'
import { addUtcDays, inclusiveDayCount, itineraryDayCount } from '#/features/catalog/isoDate'
import type { BudgetBand, Destination, Place, Trip, TripDay, TripItem } from '#/features/catalog/types'

export type GenerateTripInput = {
  destination?: Destination
  places: Place[]
  startDate: string
  endDate: string
  travelers: number
  budgetBand: BudgetBand
  interests: string[]
}

export type GenerateTripError = 'destination' | 'date' | 'range'

export type GenerateTripResult = { ok: true; trip: Trip } | { ok: false; error: GenerateTripError }

export function generateTrip(input: GenerateTripInput): GenerateTripResult {
  if (!input.destination) return { ok: false, error: 'destination' }
  if (!input.startDate || !input.endDate) return { ok: false, error: 'date' }
  const stayDays = inclusiveDayCount(input.startDate, input.endDate)
  if (stayDays < 1) return { ok: false, error: 'date' }
  if (stayDays > 14) return { ok: false, error: 'range' }

  const destination = input.destination
  const days = itineraryDayCount(input.startDate, input.endDate)
  const templates = destination.itineraryTemplates
  const placesById = new Map(input.places.map((place) => [place.id, place]))
  const interests = input.interests

  const tripDays: TripDay[] = []
  for (let d = 0; d < days; d += 1) {
    const template = templates[d % templates.length]
    const items: TripItem[] = template.items.map((item) => ({
      id: createId(),
      placeId: item.placeId,
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      completed: false,
    }))
    tripDays.push({
      dayIndex: d + 1,
      date: addUtcDays(input.startDate, d),
      items: sortItemsByInterests(items, placesById, interests),
    })
  }

  return {
    ok: true,
    trip: {
      id: createId(),
      destinationId: destination.id,
      title: destination.name,
      startDate: input.startDate,
      endDate: input.endDate,
      travelers: input.travelers,
      budgetBand: input.budgetBand,
      interests,
      status: 'draft',
      days: tripDays,
    },
  }
}

export function sortItemsByInterests(
  items: TripItem[],
  placesById: Map<string, Place>,
  interests: string[],
): TripItem[] {
  if (interests.length === 0) return items
  const interestSet = new Set(interests)
  return [...items].sort((left, right) => {
    const leftMatch = interestSet.has(placesById.get(left.placeId)?.category ?? '') ? 0 : 1
    const rightMatch = interestSet.has(placesById.get(right.placeId)?.category ?? '') ? 0 : 1
    return leftMatch - rightMatch
  })
}
