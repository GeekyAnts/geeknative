import { queryOptions, useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import type { CatalogRepository } from './CatalogRepository'

export const catalogQuery = (repository: CatalogRepository) =>
  queryOptions({
    queryKey: ['catalog'] as const,
    queryFn: () => repository.load(),
    staleTime: Infinity,
  })

/** The catalog every screen reads. */
export function useCatalog() {
  const { container } = useRouteContext({ from: '__root__' })
  return useQuery(catalogQuery(container.catalogRepository))
}
