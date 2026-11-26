import { createFileRoute } from '@tanstack/react-router'
import { MyTripsScreen } from '#/features/myTrips/MyTripsScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/trips')({
  head: () => ({ meta: [{ title: `${strings.tripsTitle} · ${AppIdentity.name}` }] }),
  component: MyTripsScreen,
})
