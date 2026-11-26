import {
  featuredDestination,
  inspirationDestinations,
  popularPlaces,
  trendingDestinations,
} from '#/features/catalog/lookups'
import { useCatalog } from '#/features/catalog/useCatalog'

export function useHomeViewModel() {
  const catalogQuery = useCatalog()
  const catalog = catalogQuery.data
  const destinationsById = new Map((catalog?.destinations ?? []).map((destination) => [destination.id, destination]))

  return {
    isError: catalogQuery.isError,
    retry: () => catalogQuery.refetch(),
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    featured: catalog ? featuredDestination(catalog) : undefined,
    trending: catalog ? trendingDestinations(catalog) : [],
    popular: catalog ? popularPlaces(catalog) : [],
    inspiration: catalog ? inspirationDestinations(catalog) : [],
    destinationName: (id: string) => destinationsById.get(id)?.name ?? id,
  }
}
