import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { strings } from '#/generated/strings'
import { statusLabel, taskStatuses, type TaskItem, type TaskStatus } from '#/features/tasks/Task'
import { isNotFound, taskQuery, taskSaved, tasksChanged } from '#/features/tasks/taskQueries'
import type { TasksRepository } from '#/features/tasks/TasksRepository'

export type TaskDetailState = { kind: 'loading' } | { kind: 'error' } | { kind: 'notFound' } | { kind: 'loaded'; task: TaskItem }

export function taskDetailState(query: { data: TaskItem | undefined; error: unknown; isFetching: boolean }): TaskDetailState {
  if (query.error && !query.isFetching) return isNotFound(query.error) ? { kind: 'notFound' } : { kind: 'error' }
  if (query.data === undefined || query.error) return { kind: 'loading' }
  return { kind: 'loaded', task: query.data }
}

/**
 * Saves a new status: the control changes at once, then the screen shows the task the server
 * returned. Returns false, with the previous status back, when saving fails.
 */
export async function changeTaskStatus(queryClient: QueryClient, repository: TasksRepository, task: TaskItem, status: TaskStatus) {
  const { queryKey } = taskQuery(repository, task.id)
  queryClient.setQueryData(queryKey, { ...task, status })
  try {
    taskSaved(queryClient, repository, await repository.updateStatus(task.id, status))
    return true
  } catch {
    queryClient.setQueryData(queryKey, task)
    return false
  }
}

/** State and actions for Task detail. */
export function useTaskDetailViewModel(taskId: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const repository = container.tasksRepository
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery(taskQuery(repository, taskId))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  return {
    state: taskDetailState(query),
    busy,
    message,
    statusOptions: taskStatuses.map((id) => ({ id, label: statusLabel(id) })),
    retry: () => void query.refetch(),
    selectStatus: async (task: TaskItem, status: TaskStatus) => {
      if (status === task.status) return
      setMessage(null)
      setBusy(true)
      const saved = await changeTaskStatus(queryClient, repository, task, status)
      setBusy(false)
      if (!saved) setMessage(strings.taskDetailUpdateError)
    },
    /** Deletes the task and returns to Tasks; on failure stays here with a message. */
    deleteTask: async () => {
      setMessage(null)
      setBusy(true)
      try {
        await repository.delete(taskId)
      } catch {
        setBusy(false)
        setMessage(strings.taskDetailDeleteError)
        return
      }
      tasksChanged(queryClient)
      await navigate({ to: '/', replace: true })
      queryClient.removeQueries({ queryKey: taskQuery(repository, taskId).queryKey })
    },
  }
}
