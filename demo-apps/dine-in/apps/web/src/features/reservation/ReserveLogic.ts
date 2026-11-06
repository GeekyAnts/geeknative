import type { Dietary, Restaurant, Seating } from '#/features/catalog/Catalog'
import { DemoAvailability, type Slot } from '#/features/catalog/DemoAvailability'
import { dietaryLabel } from '#/features/catalog/Labels'
import { isoDate } from '#/features/catalog/LocalDate'
import { defaultPreferences, type DiningPreferences } from '#/features/profile/DiningPreferences'
import { strings } from '#/generated/strings'
import { orderedDietary, type Reservation, type ReservationDraft } from '#/features/reservations/Reservation'

export const reserveSteps = ['details', 'preferences', 'review'] as const
export type ReserveStep = (typeof reserveSteps)[number]

export const MIN_GUESTS = 1

export const clampPartySize = (size: number, restaurant: Restaurant) => Math.min(Math.max(size, MIN_GUESTS), restaurant.maxPartySize)

/** At the maximum party size the plus button is disabled and the large-party message shows. */
export const isLargeParty = (size: number, restaurant: Restaurant) => size >= restaurant.maxPartySize

const supportedSeating = (seating: Seating, restaurant: Restaurant): Seating =>
  restaurant.seating.includes(seating) ? seating : (restaurant.seating[0] ?? seating)

/**
 * A new reservation: party size and seating from preferences (or from the reservation being booked
 * again), dietary from preferences, today, no time, no occasion, no notes.
 */
export function defaultDraft(
  restaurant: Restaurant,
  preferences: DiningPreferences | undefined,
  now: Date,
  rebook?: Pick<Reservation, 'partySize' | 'seating'>,
): ReservationDraft {
  const prefs = preferences ?? defaultPreferences()
  return {
    restaurantId: restaurant.id,
    date: isoDate(now),
    time: null,
    partySize: clampPartySize(rebook?.partySize ?? prefs.partySize, restaurant),
    seating: supportedSeating(rebook?.seating ?? prefs.seating, restaurant),
    occasion: 'none',
    dietary: orderedDietary(prefs.dietary),
    notes: '',
  }
}

export const draftFromReservation = (reservation: Reservation): ReservationDraft => ({
  restaurantId: reservation.restaurantId,
  date: reservation.date,
  time: reservation.time,
  partySize: reservation.partySize,
  seating: reservation.seating,
  occasion: reservation.occasion,
  dietary: orderedDietary(reservation.dietary),
  notes: reservation.notes,
})

/** The demo slots of a date; when modifying, the reservation's own slot is always available. */
export function slotsFor(restaurant: Restaurant, date: string, now: Date, original?: Reservation): Slot[] {
  const slots = DemoAvailability.slots(restaurant, date, now)
  if (!original || original.restaurantId !== restaurant.id || original.date !== date) return slots
  const own = slots.some((slot) => slot.time === original.time)
  const marked = slots.map((slot) => (slot.time === original.time ? { ...slot, available: true } : slot))
  return own ? marked : [...marked, { time: original.time, available: true }].sort((a, b) => a.time.localeCompare(b.time))
}

/** Changing the date keeps the time only if it is available on the new date. */
export function withDate(draft: ReservationDraft, date: string, slots: Slot[]): ReservationDraft {
  const keep = draft.time !== null && slots.some((slot) => slot.time === draft.time && slot.available)
  return { ...draft, date, time: keep ? draft.time : null }
}

/** Comma-separated dietary labels, or "None". */
export const dietarySummary = (dietary: Dietary[]) =>
  dietary.length > 0 ? orderedDietary(dietary).map(dietaryLabel).join(', ') : strings.reserveSummaryNone
