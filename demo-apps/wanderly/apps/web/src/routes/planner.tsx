import { createFileRoute } from '@tanstack/react-router'
import { TripPlannerScreen } from '#/features/tripPlanner/TripPlannerScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export type PlannerSearch = {
  destinationId?: string
}

export const Route = createFileRoute('/planner')({
  validateSearch: (search: Record<string, unknown>): PlannerSearch => ({
    destinationId: typeof search.destinationId === 'string' ? search.destinationId : undefined,
  }),
  head: () => ({ meta: [{ title: `${strings.plannerTitle} · ${AppIdentity.name}` }] }),
  component: TripPlannerScreen,
})
