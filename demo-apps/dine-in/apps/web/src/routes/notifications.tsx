import { createFileRoute } from '@tanstack/react-router'
import { NotificationsScreen } from '#/features/discover/NotificationsScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/notifications')({
  head: () => ({ meta: [{ title: `${strings.notificationsTitle} · ${AppIdentity.name}` }] }),
  component: NotificationsScreen,
})
