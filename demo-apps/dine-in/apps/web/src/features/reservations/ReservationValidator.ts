import type { Restaurant } from '#/features/catalog/Catalog'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { strings } from '#/generated/strings'
import { isUpcoming, type Reservation, type ReservationDraft } from './Reservation'

export const MAX_NOTES_LENGTH = 280

export type ReservationErrorCode = 'selectTime' | 'notesTooLong' | 'slotTaken' | 'duplicateTime' | 'duplicateRestaurant' | 'generic'

export class ReservationError extends Error {
  readonly code: ReservationErrorCode

  constructor(code: ReservationErrorCode) {
    super(code)
    this.code = code
  }
}

export function reservationErrorMessage(code: ReservationErrorCode): string {
  switch (code) {
    case 'selectTime':
      return strings.reserveErrorSelectTime
    case 'notesTooLong':
      return strings.reserveErrorNotesTooLong({ max: MAX_NOTES_LENGTH })
    case 'slotTaken':
      return strings.reserveErrorSlotTaken
    case 'duplicateTime':
      return strings.reserveErrorDuplicateTime
    case 'duplicateRestaurant':
      return strings.reserveErrorDuplicateRestaurant
    case 'generic':
      return strings.reserveErrorGeneric
  }
}

export interface ValidationContext {
  restaurant: Restaurant
  now: Date
  /** All of the member's reservations. */
  reservations: Reservation[]
  /** The reservation being modified, if any. */
  original?: Reservation
}

/** Checks a draft before saving, in the order of spec/features/reservation.md. Returns the first problem, or null. */
export const ReservationValidator = {
  validate(draft: ReservationDraft, { restaurant, now, reservations, original }: ValidationContext): ReservationErrorCode | null {
    if (!draft.time) return 'selectTime'
    if (draft.notes.length > MAX_NOTES_LENGTH) return 'notesTooLong'
    const ownSlot =
      original !== undefined && original.restaurantId === draft.restaurantId && original.date === draft.date && original.time === draft.time
    const open = DemoAvailability.slots(restaurant, draft.date, now).some((slot) => slot.time === draft.time && slot.available)
    if (!ownSlot && !open) return 'slotTaken'
    const others = reservations.filter((r) => r.id !== original?.id && isUpcoming(r, now))
    if (others.some((r) => r.date === draft.date && r.time === draft.time)) return 'duplicateTime'
    if (others.some((r) => r.restaurantId === draft.restaurantId && r.date === draft.date)) return 'duplicateRestaurant'
    return null
  },
}
