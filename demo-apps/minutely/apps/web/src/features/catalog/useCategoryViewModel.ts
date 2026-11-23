import { useRouteContext } from '@tanstack/react-router'
import { strings } from '#/generated/strings'
import type { Category } from './Catalog'
import type { CatalogRepository } from './CatalogRepository'

/** The category for an id. The catalog always has categories, so an unknown id shows the first one. */
export function resolveCategory(catalog: CatalogRepository, categoryId: string): Category {
  const categories = catalog.categories()
  return categories.find((category) => category.id === categoryId) ?? categories[0]
}

/** State for the Category screen. */
export function useCategoryViewModel(categoryId: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const catalog = container.catalogRepository
  const category = resolveCategory(catalog, categoryId)
  const products = catalog.products(category.id)
  return {
    category,
    categories: catalog.categories(),
    products,
    countText: strings.commonItemCount(products.length),
  }
}
