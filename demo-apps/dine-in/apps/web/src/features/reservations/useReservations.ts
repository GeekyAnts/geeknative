import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useAccount } from '#/features/auth/useSession'

export const reservationsKey = (email: string | undefined) => ['reservations', email ?? ''] as const

/** Every screen showing reservations reads this query, so they all update after a write. */
export function invalidateReservations(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ['reservations'] })
}

/** The signed-in member's reservations. */
export function useReservations() {
  const { container } = useRouteContext({ from: '__root__' })
  const account = useAccount()
  return useQuery({
    queryKey: reservationsKey(account?.email),
    queryFn: () => container.reservationsRepository.list(),
    enabled: account !== null,
  })
}

/** Cancels a reservation and refreshes every list. */
export function useCancelReservation() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  return async (id: string) => {
    const cancelled = await container.reservationsRepository.cancel(id)
    await invalidateReservations(queryClient)
    return cancelled
  }
}
