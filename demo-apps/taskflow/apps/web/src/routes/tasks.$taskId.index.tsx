import { createFileRoute } from '@tanstack/react-router'
import { TaskDetailScreen } from '#/features/task-detail/TaskDetailScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/tasks/$taskId/')({
  head: () => ({ meta: [{ title: `${strings.taskDetailTitle} · ${AppIdentity.name}` }] }),
  component: TaskDetailRoute,
})

function TaskDetailRoute() {
  const { taskId } = Route.useParams()
  return <TaskDetailScreen key={taskId} taskId={taskId} />
}
