import { createFileRoute } from '@tanstack/react-router'
import type { ReservationGroup } from '#/features/reservations/Reservation'
import { ReservationsScreen } from '#/features/reservations/ReservationsScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

const segments: readonly ReservationGroup[] = ['upcoming', 'past', 'cancelled']

export const Route = createFileRoute('/_tabs/reservations')({
  validateSearch: (search: Record<string, unknown>): { segment?: ReservationGroup } => ({
    segment: segments.find((segment) => segment === search.segment),
  }),
  head: () => ({ meta: [{ title: `${strings.reservationsTitle} · ${AppIdentity.name}` }] }),
  component: ReservationsRoute,
})

function ReservationsRoute() {
  return <ReservationsScreen segment={Route.useSearch().segment ?? 'upcoming'} />
}
