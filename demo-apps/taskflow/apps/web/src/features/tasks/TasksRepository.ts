import type { TaskFilter, TaskInput, TaskItem, TaskStatus } from './Task'

/** Thrown when the task doesn't exist (the server answers 404). */
export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task ${taskId} not found`)
    this.name = 'TaskNotFoundError'
  }
}

/** Reads and writes tasks. Screens use whichever implementation AppContainer provides. */
export interface TasksRepository {
  /** Tasks matching the filter, in the server's order. */
  list(filter: TaskFilter): Promise<TaskItem[]>
  get(taskId: string): Promise<TaskItem>
  create(input: TaskInput): Promise<TaskItem>
  /** Replaces every field of the task. */
  update(taskId: string, input: TaskInput): Promise<TaskItem>
  updateStatus(taskId: string, status: TaskStatus): Promise<TaskItem>
  delete(taskId: string): Promise<void>
}
