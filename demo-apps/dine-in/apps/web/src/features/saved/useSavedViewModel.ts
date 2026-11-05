import { useRouteContext } from '@tanstack/react-router'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import type { Restaurant } from '#/features/catalog/Catalog'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSaved } from './useSaved'

/** Saved restaurants, most recently saved first; IDs not in the catalog are ignored. */
export function savedRestaurants(ids: string[], restaurants: Restaurant[]): Restaurant[] {
  const byId = new Map(restaurants.map((r) => [r.id, r]))
  return ids.flatMap((id) => byId.get(id) ?? [])
}

export function useSavedViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const catalog = useCatalog()
  const saved = useSaved()
  const now = container.now()
  const restaurants = savedRestaurants(saved.ids, catalog.data?.restaurants ?? [])

  return {
    status:
      catalog.isPending || saved.query.isPending
        ? ('loading' as const)
        : catalog.isError || saved.query.isError
          ? ('error' as const)
          : ('ready' as const),
    retry: () => {
      void catalog.refetch()
      void saved.query.refetch()
    },
    restaurants,
    availability: (restaurant: Restaurant) => DemoAvailability.today(restaurant, now),
    remove: (id: string) => void saved.toggle(id),
  }
}
