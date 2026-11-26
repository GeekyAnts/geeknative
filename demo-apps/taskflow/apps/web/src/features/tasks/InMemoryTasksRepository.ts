import type { TaskFilter, TaskInput, TaskItem, TaskStatus } from './Task'
import { taskSamples } from './TaskSamples'
import { TaskNotFoundError, type TasksRepository } from './TasksRepository'

const statusRank = { todo: 0, inProgress: 0, done: 1 } as const
const priorityRank = { high: 0, medium: 1, low: 2 } as const

/** The server's order: open before Done, then High to Low, then earliest due date (none last), then newest. */
function serverOrder(a: TaskItem, b: TaskItem): number {
  return (
    statusRank[a.status] - statusRank[b.status] ||
    priorityRank[a.priority] - priorityRank[b.priority] ||
    (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') ||
    b.createdAt.localeCompare(a.createdAt)
  )
}

/** Keeps tasks in memory and behaves like the server. For tests and previews: nothing survives a restart. */
export class InMemoryTasksRepository implements TasksRepository {
  private tasks: TaskItem[]
  private nextId = 1

  constructor(tasks: TaskItem[] = taskSamples()) {
    this.tasks = tasks.map((task) => ({ ...task }))
  }

  async list(filter: TaskFilter): Promise<TaskItem[]> {
    return this.tasks
      .filter((task) => (filter.status === undefined || task.status === filter.status) && (filter.priority === undefined || task.priority === filter.priority))
      .sort(serverOrder)
      .map((task) => ({ ...task }))
  }

  async get(taskId: string): Promise<TaskItem> {
    return { ...this.find(taskId) }
  }

  async create(input: TaskInput): Promise<TaskItem> {
    const now = new Date().toISOString()
    const task = withInput({ id: `task-${this.nextId++}`, createdAt: now, updatedAt: now }, input)
    this.tasks.push(task)
    return { ...task }
  }

  async update(taskId: string, input: TaskInput): Promise<TaskItem> {
    const current = this.find(taskId)
    return this.replace(withInput({ id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() }, input))
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<TaskItem> {
    return this.replace({ ...this.find(taskId), status, updatedAt: new Date().toISOString() })
  }

  async delete(taskId: string): Promise<void> {
    this.find(taskId)
    this.tasks = this.tasks.filter((task) => task.id !== taskId)
  }

  private find(taskId: string): TaskItem {
    const task = this.tasks.find((candidate) => candidate.id === taskId)
    if (!task) throw new TaskNotFoundError(taskId)
    return task
  }

  private replace(task: TaskItem): TaskItem {
    this.tasks = this.tasks.map((candidate) => (candidate.id === task.id ? task : candidate))
    return { ...task }
  }
}

function withInput(base: Pick<TaskItem, 'id' | 'createdAt' | 'updatedAt'>, input: TaskInput): TaskItem {
  const task: TaskItem = { ...base, title: input.title, notes: input.notes, status: input.status, priority: input.priority }
  if (input.dueDate !== undefined) task.dueDate = input.dueDate
  return task
}
