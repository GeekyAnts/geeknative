import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useCatalog } from '#/features/catalog/useCatalog'
import { groupReservations, type Reservation, type ReservationGroup } from './Reservation'
import { useReservations } from './useReservations'

export const reservationGroups: ReservationGroup[] = ['upcoming', 'past', 'cancelled']

/** Upcoming offer Modify and Cancel; past and cancelled offer Book again. */
export const reservationActions = (group: ReservationGroup) =>
  group === 'upcoming' ? (['modify', 'cancel'] as const) : (['rebook'] as const)

export function useReservationsViewModel(segment: ReservationGroup) {
  const { container } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const catalog = useCatalog()
  const reservations = useReservations()
  const groups = groupReservations(reservations.data ?? [], container.now())

  return {
    status:
      catalog.isPending || reservations.isPending
        ? ('loading' as const)
        : catalog.isError || reservations.isError
          ? ('error' as const)
          : ('ready' as const),
    retry: () => {
      void catalog.refetch()
      void reservations.refetch()
    },
    segment,
    groups,
    items: groups[segment],
    restaurant: (reservation: Reservation) => catalog.data?.restaurants.find((r) => r.id === reservation.restaurantId),
    select: (next: ReservationGroup) => void navigate({ to: '/reservations', search: { segment: next }, replace: true }),
  }
}
