import { createFileRoute } from '@tanstack/react-router'
import { ConfirmationScreen } from '#/features/reservation/ConfirmationScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/reservations_/$reservationId/confirmation')({
  head: () => ({ meta: [{ title: `${strings.confirmationTitle} · ${AppIdentity.name}` }] }),
  component: ConfirmationRoute,
})

function ConfirmationRoute() {
  return <ConfirmationScreen reservationId={Route.useParams().reservationId} />
}
