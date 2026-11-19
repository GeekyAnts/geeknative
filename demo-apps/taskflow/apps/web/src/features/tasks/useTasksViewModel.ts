import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { strings } from '#/generated/strings'
import {
  isFilterSet,
  priorityLabel,
  statusLabel,
  taskPriorities,
  taskStatuses,
  toggledStatus,
  type TaskFilter,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
} from './Task'
import { taskSaved, tasksQuery } from './taskQueries'
import type { TasksRepository } from './TasksRepository'

export type StatusChoice = TaskStatus | 'all'
export type PriorityChoice = TaskPriority | 'any'

export type TasksState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'emptyFiltered' }
  | { kind: 'list'; tasks: TaskItem[] }

/** What Tasks shows for a list query's result. */
export function tasksState(
  query: { data: TaskItem[] | undefined; isError: boolean; isFetching: boolean },
  filter: TaskFilter,
): TasksState {
  // The first load, or loading again after an error. Later loads keep the rows on screen.
  if (query.isFetching && (query.isError || query.data === undefined)) return { kind: 'loading' }
  if (query.isError) return { kind: 'error' }
  if (query.data === undefined) return { kind: 'loading' }
  if (query.data.length === 0) return { kind: isFilterSet(filter) ? 'emptyFiltered' : 'empty' }
  return { kind: 'list', tasks: query.data }
}

export const filterFor = (status: StatusChoice, priority: PriorityChoice): TaskFilter => ({
  status: status === 'all' ? undefined : status,
  priority: priority === 'any' ? undefined : priority,
})

/**
 * Moves an open task to Done, or a Done task to To do: the row changes at once, then the change
 * is saved. Returns false, with the row back as it was, when saving fails. The row stays even if
 * it no longer matches the filter, until the next load.
 */
export async function toggleTaskStatus(queryClient: QueryClient, repository: TasksRepository, filter: TaskFilter, task: TaskItem) {
  const { queryKey } = tasksQuery(repository, filter)
  const replace = (next: TaskItem) =>
    queryClient.setQueryData(queryKey, (tasks) => tasks?.map((candidate) => (candidate.id === next.id ? next : candidate)))

  replace({ ...task, status: toggledStatus(task.status) })
  try {
    const saved = await repository.updateStatus(task.id, toggledStatus(task.status))
    replace(saved)
    taskSaved(queryClient, repository, saved)
    return true
  } catch {
    replace(task)
    return false
  }
}

/** State and actions for the Tasks screen. */
export function useTasksViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const repository = container.tasksRepository
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StatusChoice>('all')
  const [priority, setPriority] = useState<PriorityChoice>('any')
  const [updateFailed, setUpdateFailed] = useState(false)
  const filter = filterFor(status, priority)
  const query = useQuery(tasksQuery(repository, filter))
  const state = tasksState(query, filter)

  return {
    state,
    countText: state.kind === 'list' ? strings.tasksCount(state.tasks.length) : null,
    status,
    priority,
    statusOptions: [
      { id: 'all' as StatusChoice, label: strings.tasksFilterAll },
      ...taskStatuses.map((id) => ({ id: id as StatusChoice, label: statusLabel(id) })),
    ],
    priorityOptions: [
      { id: 'any' as PriorityChoice, label: strings.tasksFilterAnyPriority },
      ...[...taskPriorities].reverse().map((id) => ({ id: id as PriorityChoice, label: priorityLabel(id) })),
    ],
    selectStatus: setStatus,
    selectPriority: setPriority,
    clearFilters: () => {
      setStatus('all')
      setPriority('any')
    },
    retry: () => void query.refetch(),
    updateError: updateFailed ? strings.tasksUpdateError : null,
    toggle: async (task: TaskItem) => {
      setUpdateFailed(false)
      if (!(await toggleTaskStatus(queryClient, repository, filter, task))) setUpdateFailed(true)
    },
  }
}
