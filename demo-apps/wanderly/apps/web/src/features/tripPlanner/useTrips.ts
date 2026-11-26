import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useHydrated } from '#/core/useHydrated'
import type { Trip } from '#/features/catalog/types'
import type { TripRepository } from './TripRepository'

export const tripsQuery = (repository: TripRepository) =>
  queryOptions({
    queryKey: ['trips'] as const,
    queryFn: () => repository.list(),
  })

export function useTrips() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const hydrated = useHydrated()
  const queryKey = tripsQuery(container.tripRepository).queryKey
  const { data, isFetched, isError } = useQuery({
    ...tripsQuery(container.tripRepository),
    enabled: hydrated,
    retry: false,
  })
  const trips = data ?? []

  const syncFromRepository = async () => {
    const next = await container.tripRepository.list()
    queryClient.setQueryData(queryKey, next)
    return next
  }

  return {
    trips,
    ready: hydrated && (isFetched || isError || data !== undefined),
    refresh: () => syncFromRepository(),
    upsert: async (trip: Trip) => {
      await container.tripRepository.upsert(trip)
      await syncFromRepository()
    },
    remove: async (id: string) => {
      await container.tripRepository.delete(id)
      await syncFromRepository()
    },
  }
}
