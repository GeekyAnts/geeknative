import { createFileRoute } from '@tanstack/react-router'
import { VenuesScreen } from '#/features/venues/VenuesScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/venues/')({
  head: () => ({ meta: [{ title: `${strings.venuesTitle} · ${AppIdentity.name}` }] }),
  component: VenuesScreen,
})
