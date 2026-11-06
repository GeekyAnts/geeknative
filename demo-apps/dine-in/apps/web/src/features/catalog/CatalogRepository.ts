import type { Catalog } from './Catalog'

/** Reads the restaurant catalog. A future backend adds `RemoteCatalogRepository`; nothing else changes. */
export interface CatalogRepository {
  load(): Promise<Catalog>
}
