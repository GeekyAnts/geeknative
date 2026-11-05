import { firstName } from '#/features/auth/Account'
import type { CuisineId, Restaurant } from '#/features/catalog/Catalog'
import { groupReservations, reservationDateTime, type Reservation } from '#/features/reservations/Reservation'
import { strings } from '#/generated/strings'

export type GreetingTime = 'morning' | 'afternoon' | 'evening'

/** Morning 05:00–11:59, afternoon 12:00–16:59, evening otherwise. */
export function greetingTime(now: Date): GreetingTime {
  const hour = now.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'evening'
}

export function greeting(now: Date, name: string): string {
  const time = greetingTime(now)
  const text =
    time === 'morning'
      ? strings.discoverGreetingMorning
      : time === 'afternoon'
        ? strings.discoverGreetingAfternoon
        : strings.discoverGreetingEvening
  return strings.discoverGreetingName({ greeting: text, name: firstName(name) })
}

/** The soonest upcoming reservation, if any ("Your next evening"). */
export function nextReservation(reservations: Reservation[], now: Date): Reservation | null {
  return groupReservations(reservations, now).upcoming[0] ?? null
}

const REMINDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** One reminder per upcoming confirmed reservation within the next 7 days, soonest first; none when reminders are off. */
export function reminders(reservations: Reservation[], now: Date, enabled: boolean): Reservation[] {
  if (!enabled) return []
  return groupReservations(reservations, now).upcoming.filter(
    (reservation) => reservationDateTime(reservation).getTime() - now.getTime() <= REMINDER_WINDOW_MS,
  )
}

/** Restaurants whose cuisine is a favourite, sorted by rating (ties keep catalog order). */
export function recommended(restaurants: Restaurant[], favourites: CuisineId[]): Restaurant[] {
  if (favourites.length === 0) return []
  return restaurants.filter((r) => favourites.includes(r.cuisine)).sort((a, b) => b.rating - a.rating)
}

export const SPOTLIGHT_RESTAURANT_ID = 'koyo'

/** The first two sentences of a text. */
export function firstSentences(text: string, count = 2): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]
  return sentences.slice(0, count).join('').trim()
}
