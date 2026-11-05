import type { Restaurant } from './Catalog'
import { addDays, dateAt, isoDate, minutesOf, timeOf, weekdayOf } from './LocalDate'

/** A reservable time on a date at a restaurant. */
export interface Slot {
  time: string
  available: boolean
}

export type TodayAvailability = 'available' | 'full' | 'closed'

const SLOT_STEP_MINUTES = 30
const LAST_SEATING_BEFORE_CLOSE_MINUTES = 90
const MINIMUM_NOTICE_MINUTES = 60
export const BOOKABLE_DAYS = 30

/** 32-bit FNV-1a over the UTF-8 bytes of `text`. */
export function fnv1a32(text: string): number {
  let hash = 0x811c9dc5
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/**
 * The deterministic demonstration availability rule (spec/features/catalog.md), identical on every
 * platform. Pure: `now` is injected so tests are deterministic.
 */
export const DemoAvailability = {
  isClosed(restaurant: Restaurant, date: string): boolean {
    return restaurant.openingHours[weekdayOf(date)] === null
  },

  slots(restaurant: Restaurant, date: string, now: Date): Slot[] {
    const hours = restaurant.openingHours[weekdayOf(date)]
    if (!hours) return []
    const open = minutesOf(hours.open)
    let close = minutesOf(hours.close)
    if (close <= open) close += 24 * 60
    const today = date === isoDate(now)
    const slots: Slot[] = []
    for (let minutes = open; minutes <= close - LAST_SEATING_BEFORE_CLOSE_MINUTES; minutes += SLOT_STEP_MINUTES) {
      if (today && dateAt(date, minutes).getTime() - now.getTime() < MINIMUM_NOTICE_MINUTES * 60_000) continue
      const time = timeOf(minutes)
      const available = fnv1a32(`${restaurant.id}|${date}|${time}`) % 100 >= restaurant.demandPercent
      slots.push({ time, available })
    }
    return slots
  },

  today(restaurant: Restaurant, now: Date): TodayAvailability {
    const date = isoDate(now)
    if (DemoAvailability.isClosed(restaurant, date)) return 'closed'
    return DemoAvailability.slots(restaurant, date, now).some((slot) => slot.available) ? 'available' : 'full'
  },

  /** Today through today + 29 days. */
  bookableDates(now: Date): string[] {
    const today = isoDate(now)
    return Array.from({ length: BOOKABLE_DAYS }, (_, index) => addDays(today, index))
  },
}
