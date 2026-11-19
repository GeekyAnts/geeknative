import { ApiError, createTask, deleteTask, getTask, listTasks, updateTask, updateTaskStatus } from '#/generated/api'
import type { TaskFilter, TaskInput, TaskItem, TaskStatus } from './Task'
import { TaskNotFoundError, type TasksRepository } from './TasksRepository'

/** Talks to the Taskflow server at AppConfig.apiBaseUrl through the generated API client. */
export class ApiTasksRepository implements TasksRepository {
  list(filter: TaskFilter): Promise<TaskItem[]> {
    return listTasks({ status: filter.status, priority: filter.priority })
  }

  get(taskId: string): Promise<TaskItem> {
    return notFoundAs(taskId, getTask({ taskId }))
  }

  create(input: TaskInput): Promise<TaskItem> {
    return createTask({ body: input })
  }

  update(taskId: string, input: TaskInput): Promise<TaskItem> {
    return notFoundAs(taskId, updateTask({ taskId, body: input }))
  }

  updateStatus(taskId: string, status: TaskStatus): Promise<TaskItem> {
    return notFoundAs(taskId, updateTaskStatus({ taskId, body: { status } }))
  }

  delete(taskId: string): Promise<void> {
    return notFoundAs(taskId, deleteTask({ taskId }))
  }
}

async function notFoundAs<T>(taskId: string, request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw new TaskNotFoundError(taskId)
    throw error
  }
}
