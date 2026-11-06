import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { emptyWeddingPlan, type Enquiry, type WeddingPlan } from '#/features/catalog/types'
import { mergePlan, type WeddingRepository } from './WeddingRepository'

export const weddingPlanQuery = (repository: WeddingRepository) =>
  queryOptions({
    queryKey: ['wedding', 'plan'] as const,
    queryFn: () => repository.getPlan(),
    staleTime: Infinity,
  })

export async function patchPlan(queryClient: ReturnType<typeof useQueryClient>, repository: WeddingRepository, patch: Partial<WeddingPlan>) {
  const current = queryClient.getQueryData(weddingPlanQuery(repository).queryKey) ?? (await repository.getPlan())
  const next = mergePlan(current, patch)
  queryClient.setQueryData(weddingPlanQuery(repository).queryKey, next)
  await repository.savePlan(next)
  return next
}

export function useWeddingPlan() {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const { data } = useQuery(weddingPlanQuery(container.weddingRepository))
  const plan = data ?? emptyWeddingPlan

  return {
    plan,
    repository: container.weddingRepository,
    update: (patch: Partial<WeddingPlan>) => patchPlan(queryClient, container.weddingRepository, patch),
    addEnquiry: async (enquiry: Enquiry) => {
      const enquiries = await container.weddingRepository.addEnquiry(enquiry)
      return enquiries
    },
  }
}
