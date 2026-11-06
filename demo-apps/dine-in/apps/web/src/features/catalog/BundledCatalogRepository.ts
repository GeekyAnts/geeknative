import bundled from '#/data/catalog.json'
import { parseCatalog, type Catalog } from './Catalog'
import type { CatalogRepository } from './CatalogRepository'

/** The catalog bundled with the app (src/data/catalog.json, copied by `make assets`), parsed once and cached. */
export class BundledCatalogRepository implements CatalogRepository {
  private cached: Catalog | undefined

  async load(): Promise<Catalog> {
    this.cached ??= parseCatalog(bundled)
    return this.cached
  }
}
