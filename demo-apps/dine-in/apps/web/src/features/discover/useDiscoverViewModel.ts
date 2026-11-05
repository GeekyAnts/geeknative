import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { initials } from '#/features/auth/Account'
import { useAccount } from '#/features/auth/useSession'
import type { CuisineId } from '#/features/catalog/Catalog'
import { DemoAvailability } from '#/features/catalog/DemoAvailability'
import { useCatalog } from '#/features/catalog/useCatalog'
import { usePreferences } from '#/features/profile/usePreferences'
import { useReservations } from '#/features/reservations/useReservations'
import { useSaved } from '#/features/saved/useSaved'
import { SPOTLIGHT_RESTAURANT_ID, greeting, nextReservation, recommended, reminders } from './DiscoverLogic'

/** Combines the catalog, the member, saved IDs, reservations, preferences and the clock. */
export function useDiscoverViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const catalog = useCatalog()
  const account = useAccount()
  const saved = useSaved()
  const reservations = useReservations()
  const { preferences } = usePreferences()
  const now = container.now()

  const restaurants = catalog.data?.restaurants ?? []
  const restaurant = (id: string) => restaurants.find((r) => r.id === id)
  const memberReservations = reservations.data ?? []
  const next = nextReservation(memberReservations, now)

  return {
    status: catalog.isPending ? ('loading' as const) : catalog.isError ? ('error' as const) : ('ready' as const),
    retry: () => void catalog.refetch(),
    catalog: catalog.data,
    greeting: greeting(now, account?.name ?? ''),
    initials: initials(account?.name ?? ''),
    hasReminders: reminders(memberReservations, now, preferences?.reminders ?? true).length > 0,
    next: next ? { reservation: next, restaurant: restaurant(next.restaurantId) } : null,
    spotlight: restaurant(SPOTLIGHT_RESTAURANT_ID),
    recommended: recommended(restaurants, preferences?.cuisines ?? []),
    featured: restaurants.filter((r) => r.featured),
    availability: (id: string) => {
      const r = restaurant(id)
      return r ? DemoAvailability.today(r, now) : 'closed'
    },
    isSaved: saved.isSaved,
    toggleSaved: (id: string) => void saved.toggle(id),
    openCuisine: (cuisine: CuisineId) => navigate({ to: '/explore', search: { cuisine } }),
  }
}
