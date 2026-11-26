import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useHydrated } from '#/core/useHydrated'
import type { Profile } from '#/features/catalog/types'
import { defaultProfile } from './parseProfile'
import type { ProfileRepository } from './ProfileRepository'

export const profileQuery = (repository: ProfileRepository) =>
  queryOptions({
    queryKey: ['profile'] as const,
    queryFn: () => repository.get(),
  })

export function useProfile() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const hydrated = useHydrated()
  const { data } = useQuery(profileQuery(container.profileRepository))
  const profile = hydrated ? (data ?? defaultProfile()) : defaultProfile()

  return {
    profile,
    save: async (next: Profile) => {
      await container.profileRepository.set(next)
      queryClient.setQueryData(profileQuery(container.profileRepository).queryKey, next)
    },
  }
}
