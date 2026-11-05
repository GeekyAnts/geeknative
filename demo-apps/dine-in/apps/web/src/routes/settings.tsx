import { createFileRoute } from '@tanstack/react-router'
import { SettingsScreen } from '#/features/settings/SettingsScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: `${strings.settingsTitle} · ${AppIdentity.name}` }] }),
  component: SettingsScreen,
})
