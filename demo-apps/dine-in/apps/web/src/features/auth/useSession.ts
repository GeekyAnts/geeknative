import { queryOptions, useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import type { Account } from './Account'
import type { AuthRepository } from './AuthRepository'

export const sessionQuery = (repository: AuthRepository) =>
  queryOptions({
    queryKey: ['auth', 'session'] as const,
    queryFn: () => repository.currentAccount(),
    staleTime: Infinity,
  })

/** The signed-in member, or null when signed out. */
export function useSession() {
  const { container } = useRouteContext({ from: '__root__' })
  return useQuery(sessionQuery(container.authRepository))
}

/** The signed-in member on screens that are only shown with a session. */
export function useAccount(): Account | null {
  return useSession().data ?? null
}
