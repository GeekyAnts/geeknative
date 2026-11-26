import type { Trip } from '#/features/catalog/types'
import type { TripRepository } from './TripRepository'
import { classifyTrips } from './parseTrip'

/** In-memory trips for tests. */
export class InMemoryTripRepository implements TripRepository {
  private trips: Trip[]

  constructor(trips: Trip[] = []) {
    this.trips = trips
  }

  async list(): Promise<Trip[]> {
    const { trips } = classifyTrips(this.trips)
    this.trips = trips
    return trips
  }

  async get(id: string): Promise<Trip | undefined> {
    return (await this.list()).find((trip) => trip.id === id)
  }

  async upsert(trip: Trip): Promise<void> {
    const trips = await this.list()
    const index = trips.findIndex((entry) => entry.id === trip.id)
    this.trips = index >= 0 ? trips.map((entry, i) => (i === index ? trip : entry)) : [trip, ...trips]
  }

  async delete(id: string): Promise<void> {
    this.trips = (await this.list()).filter((trip) => trip.id !== id)
  }
}
