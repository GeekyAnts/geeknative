import { memoryStorage } from '#/core/KeyValueStorage'
import { reservationsStorageKey, type Reservation } from './Reservation'
import { LocalStorageReservationsRepository, type ReservationsRepositoryOptions } from './LocalStorageReservationsRepository'

const MEMBER = 'member'

/** Reservations held in memory for one member, for tests and previews. */
export class InMemoryReservationsRepository extends LocalStorageReservationsRepository {
  constructor(initial: Reservation[] = [], options: ReservationsRepositoryOptions = {}) {
    super(memoryStorage({ [reservationsStorageKey(MEMBER)]: JSON.stringify(initial) }), () => MEMBER, options)
  }
}
