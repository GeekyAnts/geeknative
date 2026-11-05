import {
  isCuisineId,
  isDietary,
  isSeating,
  type CuisineId,
  type Dietary,
  type Seating,
} from '#/features/catalog/Catalog'
import { orderedDietary } from '#/features/reservations/Reservation'

/** The member's dining preferences. Stored as JSON under `preferences.<email>`. */
export interface DiningPreferences {
  cuisines: CuisineId[]
  dietary: Dietary[]
  seating: Seating
  partySize: number
  reminders: boolean
}

export const MIN_PARTY_SIZE = 1
export const MAX_PREFERRED_PARTY_SIZE = 12

export const defaultPreferences = (): DiningPreferences => ({
  cuisines: [],
  dietary: [],
  seating: 'indoor',
  partySize: 2,
  reminders: true,
})

export const preferencesStorageKey = (email: string) => `preferences.${email.toLowerCase()}`

/** Unknown values are dropped; a missing or invalid object means the defaults. */
export function parsePreferences(value: unknown): DiningPreferences {
  const defaults = defaultPreferences()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults
  const raw = value as Record<string, unknown>
  const partySize = raw.partySize
  return {
    cuisines: Array.isArray(raw.cuisines) ? [...new Set(raw.cuisines.filter(isCuisineId))] : defaults.cuisines,
    dietary: Array.isArray(raw.dietary) ? orderedDietary(raw.dietary.filter(isDietary)) : defaults.dietary,
    seating: isSeating(raw.seating) ? raw.seating : defaults.seating,
    partySize:
      typeof partySize === 'number' && Number.isInteger(partySize) && partySize >= MIN_PARTY_SIZE && partySize <= MAX_PREFERRED_PARTY_SIZE
        ? partySize
        : defaults.partySize,
    reminders: typeof raw.reminders === 'boolean' ? raw.reminders : defaults.reminders,
  }
}
