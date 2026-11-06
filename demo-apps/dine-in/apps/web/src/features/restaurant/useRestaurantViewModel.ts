import { useRouteContext } from '@tanstack/react-router'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { useCatalog } from '#/features/catalog/useCatalog'
import { useSaved } from '#/features/saved/useSaved'
import { mapTile, openingHoursRows } from './RestaurantLogic'

export function useRestaurantViewModel(restaurantId: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const catalog = useCatalog()
  const saved = useSaved()
  const now = container.now()
  const restaurant = catalog.data?.restaurants.find((r) => r.id === restaurantId)

  const status = catalog.isPending
    ? ('loading' as const)
    : catalog.isError
      ? ('error' as const)
      : restaurant
        ? ('ready' as const)
        : ('notFound' as const)

  return {
    status,
    retry: () => void catalog.refetch(),
    restaurant,
    availability: restaurant ? DemoAvailability.today(restaurant, now) : ('closed' as const),
    hours: restaurant ? openingHoursRows(restaurant, now) : [],
    map: restaurant ? mapTile(restaurant.latitude, restaurant.longitude) : null,
    saved: saved.isSaved(restaurantId),
    toggleSaved: () => void saved.toggle(restaurantId),
  }
}

export type RestaurantViewModel = ReturnType<typeof useRestaurantViewModel>
