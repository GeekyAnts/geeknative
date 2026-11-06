import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useAccount } from '#/features/auth/useSession'

const savedKey = (email: string | undefined) => ['saved', email ?? ''] as const

/** The member's saved restaurant IDs and the toggle every heart in the app shares. */
export function useSaved() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const account = useAccount()
  const key = savedKey(account?.email)
  const query = useQuery({
    queryKey: key,
    queryFn: () => container.savedRepository.ids(),
    enabled: account !== null,
  })
  const ids = query.data ?? []

  const toggle = async (restaurantId: string) => {
    // Update every heart at once, then save.
    queryClient.setQueryData<string[]>(key, (current = []) =>
      current.includes(restaurantId) ? current.filter((id) => id !== restaurantId) : [restaurantId, ...current],
    )
    const saved = await container.savedRepository.toggle(restaurantId)
    await queryClient.invalidateQueries({ queryKey: ['saved'] })
    return saved
  }

  return { query, ids, isSaved: (id: string) => ids.includes(id), toggle }
}
