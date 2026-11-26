import type { Trip } from '#/features/catalog/types'

/** Planned trips and itineraries. */
export interface TripRepository {
  list(): Promise<Trip[]>
  get(id: string): Promise<Trip | undefined>
  upsert(trip: Trip): Promise<void>
  delete(id: string): Promise<void>
}
