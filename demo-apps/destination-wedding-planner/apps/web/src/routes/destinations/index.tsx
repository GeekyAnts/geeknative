import { createFileRoute } from '@tanstack/react-router'
import { DestinationsScreen } from '#/features/destinations/DestinationsScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/destinations/')({
  head: () => ({ meta: [{ title: `${strings.destinationsTitle} · ${AppIdentity.name}` }] }),
  component: DestinationsScreen,
})
