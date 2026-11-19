import type { TaskInput, TaskItem } from '#/generated/api'
import { strings } from '#/generated/strings'

export type { TaskInput, TaskItem }

/** A task's status. Stored and sent as these exact values on every platform. */
export const taskStatuses = ['todo', 'inProgress', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

/** A task's priority, in the order the editor offers it. */
export const taskPriorities = ['low', 'medium', 'high'] as const
export type TaskPriority = (typeof taskPriorities)[number]

/** The filters on Tasks. A missing value means All (status) or Any priority. */
export interface TaskFilter {
  status?: TaskStatus
  priority?: TaskPriority
}

export const isFilterSet = (filter: TaskFilter) => filter.status !== undefined || filter.priority !== undefined

export function statusLabel(status: TaskStatus) {
  switch (status) {
    case 'todo':
      return strings.taskStatusTodo
    case 'inProgress':
      return strings.taskStatusInProgress
    case 'done':
      return strings.taskStatusDone
  }
}

export function priorityLabel(priority: TaskPriority) {
  switch (priority) {
    case 'low':
      return strings.taskPriorityLow
    case 'medium':
      return strings.taskPriorityMedium
    case 'high':
      return strings.taskPriorityHigh
  }
}

/** The status the list's toggle moves a task to: open tasks to Done, Done back to To do. */
export const toggledStatus = (status: TaskStatus): TaskStatus => (status === 'done' ? 'todo' : 'done')
