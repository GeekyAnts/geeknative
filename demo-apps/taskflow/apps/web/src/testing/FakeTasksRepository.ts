import type { TaskFilter, TaskInput, TaskItem, TaskStatus } from '#/features/tasks/Task'
import { InMemoryTasksRepository } from '#/features/tasks/InMemoryTasksRepository'
import type { TasksRepository } from '#/features/tasks/TasksRepository'

type Method = keyof TasksRepository

/**
 * An in-memory repository for tests that records every call and can be told to fail or to wait.
 * `listResponse` makes `list` return exactly those tasks, in that order.
 */
export class FakeTasksRepository implements TasksRepository {
  readonly calls: { method: Method; args: unknown[] }[] = []
  readonly failing = new Set<Method>()
  readonly waiting = new Set<Method>()
  listResponse: TaskItem[] | undefined
  private readonly store: InMemoryTasksRepository
  private releases: (() => void)[] = []

  constructor(tasks?: TaskItem[]) {
    this.store = new InMemoryTasksRepository(tasks)
  }

  /** Lets every waiting call continue. */
  release() {
    const releases = this.releases
    this.releases = []
    releases.forEach((release) => release())
  }

  callsTo(method: Method) {
    return this.calls.filter((call) => call.method === method).map((call) => call.args)
  }

  list(filter: TaskFilter) {
    return this.run('list', [filter], () => (this.listResponse ? Promise.resolve(this.listResponse) : this.store.list(filter)))
  }

  get(taskId: string) {
    return this.run('get', [taskId], () => this.store.get(taskId))
  }

  create(input: TaskInput) {
    return this.run('create', [input], () => this.store.create(input))
  }

  update(taskId: string, input: TaskInput) {
    return this.run('update', [taskId, input], () => this.store.update(taskId, input))
  }

  updateStatus(taskId: string, status: TaskStatus) {
    return this.run('updateStatus', [taskId, status], () => this.store.updateStatus(taskId, status))
  }

  delete(taskId: string) {
    return this.run('delete', [taskId], () => this.store.delete(taskId))
  }

  private async run<T>(method: Method, args: unknown[], perform: () => Promise<T>): Promise<T> {
    this.calls.push({ method, args })
    if (this.waiting.has(method)) await new Promise<void>((resolve) => this.releases.push(resolve))
    if (this.failing.has(method)) throw new Error(`${method} failed`)
    return perform()
  }
}
