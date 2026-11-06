import { createFileRoute } from '@tanstack/react-router'
import { DiscoverScreen } from '#/features/discover/DiscoverScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/_tabs/')({
  head: () => ({ meta: [{ title: `${strings.tabDiscover} · ${AppIdentity.name}` }] }),
  component: DiscoverScreen,
})
