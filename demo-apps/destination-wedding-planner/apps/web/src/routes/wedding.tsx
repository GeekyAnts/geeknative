import { createFileRoute } from '@tanstack/react-router'
import { WeddingScreen } from '#/features/wedding/WeddingScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/wedding')({
  head: () => ({ meta: [{ title: `${strings.weddingTitle} · ${AppIdentity.name}` }] }),
  component: WeddingScreen,
})
