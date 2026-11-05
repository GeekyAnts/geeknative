import { createFileRoute } from '@tanstack/react-router'
import { HelpScreen } from '#/features/profile/HelpScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/help')({
  head: () => ({ meta: [{ title: `${strings.helpTitle} · ${AppIdentity.name}` }] }),
  component: HelpScreen,
})
