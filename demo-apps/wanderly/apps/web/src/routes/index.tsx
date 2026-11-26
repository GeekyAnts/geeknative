import { createFileRoute } from '@tanstack/react-router'
import { HomeScreen } from '#/features/home/HomeScreen'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: AppIdentity.name }] }),
  component: HomeScreen,
})
