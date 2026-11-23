import type { Category, Product } from './Catalog'

/**
 * The products and categories the store sells. Screens use whichever implementation AppContainer provides.
 * The catalog is bundled, so reads are synchronous: there are no loading or error states.
 */
export interface CatalogRepository {
  /** All categories, in catalog order. */
  categories(): Category[]
  /** One category's products, in catalog order. */
  products(categoryId: string): Product[]
  /** One product, or undefined. */
  product(id: string): Product | undefined
  /** Products marked as bestsellers, in catalog order. */
  bestsellers(): Product[]
  /** Products whose name and category name contain every word of the query (spec/features/search.md). */
  search(query: string): Product[]
}
