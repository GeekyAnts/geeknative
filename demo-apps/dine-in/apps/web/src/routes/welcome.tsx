import { createFileRoute } from '@tanstack/react-router'
import { WelcomeScreen } from '#/features/auth/WelcomeScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/welcome')({
  head: () => ({ meta: [{ title: `${strings.brandTagline} · ${AppIdentity.name}` }] }),
  component: WelcomeScreen,
})
