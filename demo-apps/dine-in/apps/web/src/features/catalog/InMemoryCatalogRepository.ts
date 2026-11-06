import bundled from '#/data/catalog.json'
import { parseCatalog, type Catalog } from './Catalog'
import type { CatalogRepository } from './CatalogRepository'

/** A catalog held in memory, for tests and previews. Defaults to the bundled demo catalog. */
export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly catalog: Catalog | Error

  constructor(catalog: Catalog | Error = parseCatalog(bundled)) {
    this.catalog = catalog
  }

  async load(): Promise<Catalog> {
    if (this.catalog instanceof Error) throw this.catalog
    return this.catalog
  }
}
