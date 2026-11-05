import { createFileRoute } from '@tanstack/react-router'
import { ReserveScreen } from '#/features/reservation/ReserveScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/restaurants/$restaurantId/reserve')({
  validateSearch: (search: Record<string, unknown>): { reservationId?: string } => ({
    reservationId: typeof search.reservationId === 'string' ? search.reservationId : undefined,
  }),
  head: () => ({ meta: [{ title: `${strings.reserveTitle} · ${AppIdentity.name}` }] }),
  component: ReserveRoute,
})

function ReserveRoute() {
  const { restaurantId } = Route.useParams()
  const { reservationId } = Route.useSearch()
  return <ReserveScreen key={`${restaurantId}-${reservationId ?? ''}`} restaurantId={restaurantId} reservationId={reservationId} />
}
