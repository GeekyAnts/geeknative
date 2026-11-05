import { useRouteContext } from '@tanstack/react-router'
import { useCatalog } from '#/features/catalog/useCatalog'
import { groupOf } from './Reservation'
import { useReservations } from './useReservations'

/** One reservation with its restaurant, for Confirmation and Reservation detail. */
export function useReservationViewModel(reservationId: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const catalog = useCatalog()
  const reservations = useReservations()
  const now = container.now()
  const reservation = reservations.data?.find((r) => r.id === reservationId)
  const restaurant = reservation ? catalog.data?.restaurants.find((r) => r.id === reservation.restaurantId) : undefined

  const status =
    catalog.isPending || reservations.isPending
      ? ('loading' as const)
      : catalog.isError || reservations.isError
        ? ('error' as const)
        : reservation && restaurant
          ? ('ready' as const)
          : ('notFound' as const)

  return {
    status,
    retry: () => {
      void catalog.refetch()
      void reservations.refetch()
    },
    reservation,
    restaurant,
    group: reservation ? groupOf(reservation, now) : null,
    now,
  }
}
