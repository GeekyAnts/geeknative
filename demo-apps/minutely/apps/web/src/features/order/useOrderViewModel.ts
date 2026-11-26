import { queryOptions, useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useHydrated } from '#/core/useHydrated'
import { AppConfig } from '#/generated/config'
import type { Order } from './Order'
import type { OrdersRepository } from './OrdersRepository'

export const orderQuery = (repository: OrdersRepository, id: string) =>
  queryOptions({
    queryKey: ['orders', id] as const,
    // Queries can't hold undefined, so a missing order is null.
    queryFn: async (): Promise<Order | null> => (await repository.order(id)) ?? null,
    staleTime: Infinity,
  })

export type OrderState = { status: 'loading' } | { status: 'notFound' } | { status: 'found'; order: Order }

/**
 * State for the Order placed screen. Orders are in localStorage, so until the page hydrates the state is
 * `loading` and the screen shows nothing, rather than the not-found state.
 */
export function useOrderViewModel(id: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const { data } = useQuery(orderQuery(container.ordersRepository, id))
  const hydrated = useHydrated()

  let state: OrderState
  if (!hydrated || data === undefined) state = { status: 'loading' }
  else if (data === null) state = { status: 'notFound' }
  else state = { status: 'found', order: data }

  return { state, deliveryMinutes: AppConfig.deliveryMinutes }
}
