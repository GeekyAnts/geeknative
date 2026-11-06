import type { Dietary, Occasion, Seating } from '#/features/catalog/Catalog'
import { dietaryOptions } from '#/features/catalog/Catalog'
import { dateTimeOf } from '#/features/catalog/LocalDate'

export type ReservationStatus = 'confirmed' | 'cancelled'

/** A booking the member made (spec/features/reservation.md). Stored as JSON under `reservations.<email>`. */
export interface Reservation {
  id: string
  confirmationCode: string
  restaurantId: string
  date: string
  time: string
  partySize: number
  seating: Seating
  occasion: Occasion
  dietary: Dietary[]
  notes: string
  status: ReservationStatus
  createdAt: string
  updatedAt: string
}

/** What the Reserve flow saves. */
export interface ReservationDraft {
  restaurantId: string
  date: string
  time: string | null
  partySize: number
  seating: Seating
  occasion: Occasion
  dietary: Dietary[]
  notes: string
}

export const reservationsStorageKey = (email: string) => `reservations.${email.toLowerCase()}`

/** Dietary choices in the order listed in PRODUCT.md. */
export const orderedDietary = (dietary: Iterable<Dietary>) => {
  const chosen = new Set(dietary)
  return dietaryOptions.filter((option) => chosen.has(option))
}

export type ReservationGroup = 'upcoming' | 'past' | 'cancelled'

export const reservationDateTime = (reservation: Pick<Reservation, 'date' | 'time'>) => dateTimeOf(reservation.date, reservation.time)

/** Upcoming: confirmed and after now. Past: confirmed and not after now. Cancelled: cancelled. */
export function groupOf(reservation: Reservation, now: Date): ReservationGroup {
  if (reservation.status === 'cancelled') return 'cancelled'
  return reservationDateTime(reservation).getTime() > now.getTime() ? 'upcoming' : 'past'
}

export const isUpcoming = (reservation: Reservation, now: Date) => groupOf(reservation, now) === 'upcoming'

/** Upcoming soonest first; past and cancelled most recent first (by date-time). */
export function groupReservations(reservations: Reservation[], now: Date): Record<ReservationGroup, Reservation[]> {
  const byTime = (a: Reservation, b: Reservation) => reservationDateTime(a).getTime() - reservationDateTime(b).getTime()
  const groups: Record<ReservationGroup, Reservation[]> = { upcoming: [], past: [], cancelled: [] }
  for (const reservation of reservations) groups[groupOf(reservation, now)].push(reservation)
  groups.upcoming.sort(byTime)
  groups.past.sort((a, b) => byTime(b, a))
  groups.cancelled.sort((a, b) => byTime(b, a))
  return groups
}
