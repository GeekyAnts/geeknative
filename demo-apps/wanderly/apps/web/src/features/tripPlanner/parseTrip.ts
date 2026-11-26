import { isBudgetBand, type Trip, type TripDay, type TripItem, type TripStatus } from '#/features/catalog/types'
import { todayIso } from '#/features/catalog/isoDate'

export const TRIPS_STORAGE_KEY = 'trips.list'

const statuses: TripStatus[] = ['draft', 'upcoming', 'past']

export function parseTrips(value: string | null | undefined): Trip[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map(parseTrip).filter((trip): trip is Trip => trip !== undefined)
  } catch {
    return []
  }
}

function parseTrip(value: unknown): Trip | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const data = value as Record<string, unknown>
  if (typeof data.id !== 'string' || typeof data.destinationId !== 'string' || typeof data.title !== 'string') {
    return undefined
  }
  if (typeof data.startDate !== 'string' || typeof data.endDate !== 'string') return undefined
  if (typeof data.travelers !== 'number' || !isBudgetBand(data.budgetBand)) return undefined
  if (!Array.isArray(data.interests) || !Array.isArray(data.days)) return undefined
  if (typeof data.status !== 'string' || !statuses.includes(data.status as TripStatus)) return undefined
  const days = data.days.map(parseDay).filter((day): day is TripDay => day !== undefined)
  return {
    id: data.id,
    destinationId: data.destinationId,
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    travelers: data.travelers,
    budgetBand: data.budgetBand,
    interests: data.interests.filter((entry): entry is string => typeof entry === 'string'),
    status: data.status as TripStatus,
    days,
  }
}

function parseDay(value: unknown): TripDay | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const data = value as Record<string, unknown>
  if (typeof data.dayIndex !== 'number' || typeof data.date !== 'string' || !Array.isArray(data.items)) return undefined
  return {
    dayIndex: data.dayIndex,
    date: data.date,
    items: data.items.map(parseItem).filter((item): item is TripItem => item !== undefined),
  }
}

function parseItem(value: unknown): TripItem | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const data = value as Record<string, unknown>
  if (typeof data.id !== 'string' || typeof data.placeId !== 'string') return undefined
  if (typeof data.startTime !== 'string' || typeof data.durationMinutes !== 'number') return undefined
  return {
    id: data.id,
    placeId: data.placeId,
    startTime: data.startTime,
    durationMinutes: data.durationMinutes,
    completed: Boolean(data.completed),
  }
}

export function classifyTrip(trip: Trip, today = todayIso()): Trip {
  if (trip.status === 'draft') return trip
  if (trip.endDate < today) return { ...trip, status: 'past' }
  return trip
}

export function classifyTrips(trips: Trip[], today = todayIso()): { trips: Trip[]; changed: boolean } {
  let changed = false
  const next = trips.map((trip) => {
    const classified = classifyTrip(trip, today)
    if (classified.status !== trip.status) changed = true
    return classified
  })
  return { trips: next, changed }
}

export type TripSegment = 'upcoming' | 'past' | 'drafts'

export function tripSegment(trip: Trip, today = todayIso()): TripSegment {
  if (trip.status === 'draft') return 'drafts'
  if (trip.endDate < today) return 'past'
  return 'upcoming'
}
