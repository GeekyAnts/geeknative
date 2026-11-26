import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useHydrated } from '#/core/useHydrated'
import type { SavedItem } from '#/features/catalog/types'
import type { SavedRepository } from './SavedRepository'

export const savedQuery = (repository: SavedRepository) =>
  queryOptions({
    queryKey: ['saved'] as const,
    queryFn: () => repository.list(),
  })

export function useSavedItems() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const hydrated = useHydrated()
  const { data } = useQuery(savedQuery(container.savedRepository))
  const items = hydrated ? (data ?? []) : []

  return {
    items,
    isSaved: (id: string) => items.some((item) => item.id === id),
    toggle: async (item: SavedItem) => {
      await container.savedRepository.toggle(item)
      await queryClient.invalidateQueries({ queryKey: savedQuery(container.savedRepository).queryKey })
    },
  }
}
