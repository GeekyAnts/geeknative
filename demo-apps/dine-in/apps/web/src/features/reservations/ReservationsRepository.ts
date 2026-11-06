import type { Reservation, ReservationDraft } from './Reservation'

/**
 * Runs inside the serialized write with the member's current reservations, so two quick taps can't
 * both pass the duplicate checks. Throw a `ReservationError` to reject the write.
 */
export type ReservationCheck = (reservations: Reservation[]) => void

/** The signed-in member's reservations. Writes are serialized (one at a time). */
export interface ReservationsRepository {
  list(): Promise<Reservation[]>
  get(id: string): Promise<Reservation | null>
  create(draft: ReservationDraft, check?: ReservationCheck): Promise<Reservation>
  update(id: string, draft: ReservationDraft, check?: ReservationCheck): Promise<Reservation>
  cancel(id: string): Promise<Reservation>
}
