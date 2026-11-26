import type { Trip } from '#/features/catalog/types'
import type { TripRepository } from './TripRepository'
import { classifyTrips, parseTrips, TRIPS_STORAGE_KEY } from './parseTrip'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Keeps trips in localStorage. Without storage (SSR) it returns []. */
export class LocalStorageTripRepository implements TripRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async list(): Promise<Trip[]> {
    return this.read()
  }

  async get(id: string): Promise<Trip | undefined> {
    return (await this.read()).find((trip) => trip.id === id)
  }

  async upsert(trip: Trip): Promise<void> {
    const trips = await this.read()
    const index = trips.findIndex((entry) => entry.id === trip.id)
    const next = index >= 0 ? trips.map((entry, i) => (i === index ? trip : entry)) : [trip, ...trips]
    this.write(next)
  }

  async delete(id: string): Promise<void> {
    this.write((await this.read()).filter((trip) => trip.id !== id))
  }

  private read(): Trip[] {
    const { trips, changed } = classifyTrips(parseTrips(this.storage?.getItem(TRIPS_STORAGE_KEY)))
    if (changed) this.write(trips)
    return trips
  }

  private write(trips: Trip[]) {
    this.storage?.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips))
  }
}
