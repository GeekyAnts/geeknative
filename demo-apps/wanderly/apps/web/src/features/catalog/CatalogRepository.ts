import type { Catalog } from './types'

/** Bundled destinations, places and itinerary templates. */
export interface CatalogRepository {
  getCatalog(): Promise<Catalog>
}
