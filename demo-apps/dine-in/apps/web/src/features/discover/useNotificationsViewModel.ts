import { useRouteContext } from '@tanstack/react-router'
import { Formatters } from '#/features/catalog/Formatters'
import { useCatalog } from '#/features/catalog/useCatalog'
import { usePreferences } from '#/features/profile/usePreferences'
import { useReservations } from '#/features/reservations/useReservations'
import { strings } from '#/generated/strings'
import { reminders } from './DiscoverLogic'

/** Reminders for upcoming reservations within the next 7 days, unless reminders are off. */
export function useNotificationsViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const catalog = useCatalog()
  const reservations = useReservations()
  const { preferences, query: preferencesQuery } = usePreferences()
  const now = container.now()

  const items = reminders(reservations.data ?? [], now, preferences?.reminders ?? true).flatMap((reservation) => {
    const restaurant = catalog.data?.restaurants.find((r) => r.id === reservation.restaurantId)
    if (!restaurant) return []
    return [
      {
        id: reservation.id,
        code: reservation.confirmationCode,
        text: strings.notificationsReminder({
          restaurant: restaurant.name,
          date: Formatters.dateShort(reservation.date),
          time: Formatters.time(reservation.time),
        }),
      },
    ]
  })

  return {
    loading: catalog.isPending || reservations.isPending || preferencesQuery.isPending,
    items,
  }
}
