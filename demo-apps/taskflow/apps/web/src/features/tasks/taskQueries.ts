import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'
import type { TaskFilter, TaskItem } from './Task'
import { TaskNotFoundError, type TasksRepository } from './TasksRepository'

/** Every list query, whatever its filter. Invalidate this after a change. */
export const allTasksKey = ['tasks'] as const

/**
 * Tasks for a filter. Loads in the browser (the server render shows the loading state), again
 * whenever the screen mounts, and when the window regains focus (DESIGN.md: Refresh).
 */
export const tasksQuery = (repository: TasksRepository, filter: TaskFilter) =>
  queryOptions({
    queryKey: [...allTasksKey, { status: filter.status, priority: filter.priority }] as const,
    queryFn: () => repository.list(filter),
    retry: false,
    refetchOnWindowFocus: true,
    // A filter change keeps the current rows on screen until the new ones arrive.
    placeholderData: keepPreviousData,
  })

/** One task, loaded every time a screen showing it mounts. */
export const taskQuery = (repository: TasksRepository, taskId: string) =>
  queryOptions({
    queryKey: ['task', taskId] as const,
    queryFn: () => repository.get(taskId),
    retry: false,
    refetchOnWindowFocus: true,
  })

export const isNotFound = (error: unknown) => error instanceof TaskNotFoundError

/** After a task changed: show the server's copy wherever it's cached, and reload lists when next shown. */
export function taskSaved(queryClient: QueryClient, repository: TasksRepository, task: TaskItem) {
  queryClient.setQueryData(taskQuery(repository, task.id).queryKey, task)
  void queryClient.invalidateQueries({ queryKey: allTasksKey, refetchType: 'none' })
}

/** After a task was created or deleted: reload lists when next shown. */
export function tasksChanged(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: allTasksKey, refetchType: 'none' })
}
