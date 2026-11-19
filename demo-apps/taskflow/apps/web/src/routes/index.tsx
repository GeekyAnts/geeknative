import { createFileRoute } from '@tanstack/react-router'
import { TasksScreen } from '#/features/tasks/TasksScreen'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: AppIdentity.name }] }),
  component: TasksScreen,
})
