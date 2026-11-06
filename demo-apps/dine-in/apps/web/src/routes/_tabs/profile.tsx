import { createFileRoute } from '@tanstack/react-router'
import { ProfileScreen } from '#/features/profile/ProfileScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/_tabs/profile')({
  head: () => ({ meta: [{ title: `${strings.profileTitle} · ${AppIdentity.name}` }] }),
  component: ProfileScreen,
})
