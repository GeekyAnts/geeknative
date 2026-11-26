import catalogJson from '#/data/catalog.json'
import type { CatalogRepository } from './CatalogRepository'
import type { Catalog } from './types'

const catalog = catalogJson as Catalog

/** Reads the bundled catalog JSON. Safe on the server. */
export class JsonCatalogRepository implements CatalogRepository {
  async getCatalog(): Promise<Catalog> {
    return catalog
  }
}

export const bundledCatalog = catalog
