import { createFileRoute } from '@tanstack/react-router'
import { TaskEditorScreen } from '#/features/task-editor/TaskEditorScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/tasks/$taskId/edit')({
  head: () => ({ meta: [{ title: `${strings.taskEditorEditTitle} · ${AppIdentity.name}` }] }),
  component: TaskEditorRoute,
})

function TaskEditorRoute() {
  const { taskId } = Route.useParams()
  return <TaskEditorScreen key={taskId} taskId={taskId} />
}
