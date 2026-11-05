import { createFileRoute } from '@tanstack/react-router'
import { PreferencesScreen } from '#/features/profile/PreferencesScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/profile_/preferences')({
  head: () => ({ meta: [{ title: `${strings.preferencesTitle} · ${AppIdentity.name}` }] }),
  component: PreferencesScreen,
})
