import { queryOptions, useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import type { CatalogRepository } from './CatalogRepository'
import { bundledCatalog } from './JsonCatalogRepository'

export const catalogQuery = (repository: CatalogRepository) =>
  queryOptions({
    queryKey: ['catalog'] as const,
    queryFn: () => repository.getCatalog(),
    initialData: bundledCatalog,
    staleTime: Infinity,
  })

export function useCatalog() {
  const { container } = useRouteContext({ from: '__root__' })
  return useQuery(catalogQuery(container.catalogRepository))
}
