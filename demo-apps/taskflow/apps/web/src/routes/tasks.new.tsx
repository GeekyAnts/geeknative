import { createFileRoute } from '@tanstack/react-router'
import { TaskEditorScreen } from '#/features/task-editor/TaskEditorScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/tasks/new')({
  head: () => ({ meta: [{ title: `${strings.taskEditorNewTitle} · ${AppIdentity.name}` }] }),
  component: TaskEditorScreen,
})
