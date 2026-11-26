import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useHydrated } from '#/core/useHydrated'
import type { CartLine, CartRepository } from './CartRepository'
import { cartSummary } from './CartSummary'

/** The one query every screen reads the cart from, so a change on one screen shows on all of them at once. */
export const cartQuery = (repository: CartRepository) =>
  queryOptions({
    queryKey: ['cart', 'lines'] as const,
    queryFn: () => repository.lines(),
    staleTime: Infinity,
  })

/** Runs a cart change and shares the new lines with every screen. */
export async function changeCart(
  queryClient: QueryClient,
  repository: CartRepository,
  change: (repository: CartRepository) => Promise<CartLine[]>,
) {
  const lines = await change(repository)
  queryClient.setQueryData(cartQuery(repository).queryKey, lines)
  return lines
}

const noLines: CartLine[] = []

/**
 * The shared cart: lines, summary and the add/remove actions.
 * The cart is in localStorage, so the server renders an empty cart and the stored one appears once the page
 * hydrates. `ready` is false until then.
 */
export function useCart() {
  const { container } = useRouteContext({ from: '__root__' })
  const { cartRepository, catalogRepository } = container
  const queryClient = useQueryClient()
  const { data } = useQuery(cartQuery(cartRepository))
  const hydrated = useHydrated()
  const lines = hydrated ? (data ?? noLines) : noLines
  const summary = useMemo(() => cartSummary(lines, (id) => catalogRepository.product(id)), [lines, catalogRepository])

  return {
    lines,
    summary,
    ready: hydrated && data !== undefined,
    quantity: (productId: string) => lines.find((line) => line.productId === productId)?.quantity ?? 0,
    add: (productId: string) => changeCart(queryClient, cartRepository, (cart) => cart.add(productId)),
    remove: (productId: string) => changeCart(queryClient, cartRepository, (cart) => cart.remove(productId)),
  }
}
