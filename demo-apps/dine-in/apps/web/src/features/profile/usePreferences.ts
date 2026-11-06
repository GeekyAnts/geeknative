import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useAccount } from '#/features/auth/useSession'
import type { DiningPreferences } from './DiningPreferences'

const preferencesKey = (email: string | undefined) => ['preferences', email ?? ''] as const

/** The member's dining preferences; saving updates Discover and Reserve at once. */
export function usePreferences() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const account = useAccount()
  const key = preferencesKey(account?.email)
  const query = useQuery({
    queryKey: key,
    queryFn: () => container.preferencesRepository.load(),
    enabled: account !== null,
  })

  const save = async (preferences: DiningPreferences) => {
    queryClient.setQueryData(key, preferences)
    await container.preferencesRepository.save(preferences)
  }

  return { query, preferences: query.data, save }
}
