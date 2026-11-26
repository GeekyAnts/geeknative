import { createFileRoute } from '@tanstack/react-router'
import { ItineraryScreen } from '#/features/itinerary/ItineraryScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/itinerary/$tripId')({
  head: () => ({ meta: [{ title: `${strings.itineraryTitle} · ${AppIdentity.name}` }] }),
  component: ItineraryScreen,
})
