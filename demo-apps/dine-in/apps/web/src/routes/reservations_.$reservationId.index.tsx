import { createFileRoute } from '@tanstack/react-router'
import { ReservationDetailScreen } from '#/features/reservations/ReservationDetailScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/reservations_/$reservationId/')({
  head: () => ({ meta: [{ title: `${strings.reservationTitle} · ${AppIdentity.name}` }] }),
  component: ReservationDetailRoute,
})

function ReservationDetailRoute() {
  return <ReservationDetailScreen reservationId={Route.useParams().reservationId} />
}
