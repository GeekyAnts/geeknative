import { readJson, type KeyValueStorage } from '#/core/KeyValueStorage'
import { orderedDietary, reservationsStorageKey, type Reservation, type ReservationDraft } from './Reservation'
import { generateConfirmationCode } from './ConfirmationCode'
import { ReservationError } from './ReservationValidator'
import type { ReservationCheck, ReservationsRepository } from './ReservationsRepository'

export interface ReservationsRepositoryOptions {
  now?: () => Date
  random?: () => number
  uuid?: () => string
}

/**
 * The member's reservations as a JSON array under `reservations.<email>`, newest `createdAt` first.
 * `member` returns the signed-in member's email. Writes run one at a time.
 */
export class LocalStorageReservationsRepository implements ReservationsRepository {
  private readonly storage: KeyValueStorage | undefined
  private readonly member: () => string | null
  private readonly now: () => Date
  private readonly random: () => number
  private readonly uuid: () => string
  private queue: Promise<unknown> = Promise.resolve()

  constructor(storage: KeyValueStorage | undefined, member: () => string | null, options: ReservationsRepositoryOptions = {}) {
    this.storage = storage
    this.member = member
    this.now = options.now ?? (() => new Date())
    this.random = options.random ?? Math.random
    this.uuid = options.uuid ?? (() => crypto.randomUUID().toLowerCase())
  }

  private key(): string | null {
    const email = this.member()
    return email ? reservationsStorageKey(email) : null
  }

  private read(): Reservation[] {
    const key = this.key()
    const value = key ? readJson(this.storage, key) : undefined
    return Array.isArray(value) ? (value as Reservation[]) : []
  }

  private write(reservations: Reservation[]) {
    const key = this.key()
    if (!key) throw new ReservationError('generic')
    const sorted = [...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    this.storage?.setItem(key, JSON.stringify(sorted))
  }

  private serialized<T>(work: () => T | Promise<T>): Promise<T> {
    const result = this.queue.then(work)
    this.queue = result.catch(() => undefined)
    return result
  }

  async list(): Promise<Reservation[]> {
    return this.read()
  }

  async get(id: string): Promise<Reservation | null> {
    return this.read().find((r) => r.id === id) ?? null
  }

  create(draft: ReservationDraft, check?: ReservationCheck): Promise<Reservation> {
    return this.serialized(() => {
      const reservations = this.read()
      check?.(reservations)
      if (!draft.time) throw new ReservationError('selectTime')
      const timestamp = this.now().toISOString()
      const reservation: Reservation = {
        id: this.uuid(),
        confirmationCode: generateConfirmationCode(
          reservations.map((r) => r.confirmationCode),
          this.random,
        ),
        restaurantId: draft.restaurantId,
        date: draft.date,
        time: draft.time,
        partySize: draft.partySize,
        seating: draft.seating,
        occasion: draft.occasion,
        dietary: orderedDietary(draft.dietary),
        notes: draft.notes,
        status: 'confirmed',
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      this.write([reservation, ...reservations])
      return reservation
    })
  }

  update(id: string, draft: ReservationDraft, check?: ReservationCheck): Promise<Reservation> {
    return this.serialized(() => {
      const reservations = this.read()
      const existing = reservations.find((r) => r.id === id)
      if (!existing) throw new ReservationError('generic')
      check?.(reservations)
      if (!draft.time) throw new ReservationError('selectTime')
      const updated: Reservation = {
        ...existing,
        restaurantId: draft.restaurantId,
        date: draft.date,
        time: draft.time,
        partySize: draft.partySize,
        seating: draft.seating,
        occasion: draft.occasion,
        dietary: orderedDietary(draft.dietary),
        notes: draft.notes,
        updatedAt: this.now().toISOString(),
      }
      this.write(reservations.map((r) => (r.id === id ? updated : r)))
      return updated
    })
  }

  cancel(id: string): Promise<Reservation> {
    return this.serialized(() => {
      const reservations = this.read()
      const existing = reservations.find((r) => r.id === id)
      if (!existing) throw new ReservationError('generic')
      const cancelled: Reservation = { ...existing, status: 'cancelled', updatedAt: this.now().toISOString() }
      this.write(reservations.map((r) => (r.id === id ? cancelled : r)))
      return cancelled
    })
  }
}
