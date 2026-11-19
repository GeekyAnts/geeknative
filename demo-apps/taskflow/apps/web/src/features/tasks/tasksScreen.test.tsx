// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { FakeTasksRepository } from '#/testing/FakeTasksRepository'
import { click, renderApp, selectOption, settle, testContainer } from '#/testing/renderApp'
import { formatMediumDate } from './TaskDates'
import { taskSamples } from './TaskSamples'

const byTestId = (root: ParentNode, id: string) => root.querySelector(`[data-testid="${id}"]`)
const rowIds = (root: ParentNode) =>
  [...root.querySelectorAll('[data-testid="tasks.list"] > li')].map((row) => row.getAttribute('data-testid')?.replace('tasks.row.', ''))
const statusRadio = (root: ParentNode, value: string) => root.querySelector(`[data-testid="tasks.statusFilter"] input[value="${value}"]`)

async function renderTasks(repository = new FakeTasksRepository()) {
  const app = await renderApp('/', testContainer({ tasksRepository: repository }))
  await settle()
  return { app, repository, root: app.element }
}

describe('Tasks', () => {
  test("AC-tasks-1: lists the server's tasks in order, with title, priority, status and due date", async () => {
    const samples = taskSamples()
    const repository = new FakeTasksRepository(samples)
    repository.listResponse = [samples[2], samples[0], samples[3], samples[1]]
    const { app, root } = await renderTasks(repository)

    expect(byTestId(root, 'tasks.list')?.tagName).toBe('UL')
    expect(rowIds(root)).toEqual(['sample-3', 'sample-1', 'sample-4', 'sample-2'])
    const first = byTestId(root, 'tasks.row.sample-1')!
    expect(first.textContent).toContain('Finalize Q4 product roadmap')
    expect(first.textContent).toContain(strings.taskPriorityHigh)
    expect(first.textContent).toContain(strings.taskStatusInProgress)
    expect(first.textContent).toContain(strings.taskDue({ date: formatMediumDate(samples[0].dueDate!) }))
    const noDueDate = byTestId(root, 'tasks.row.sample-4')!
    expect(noDueDate.textContent).toContain(strings.taskStatusDone)
    expect(noDueDate.textContent).not.toContain(strings.taskDue({ date: '' }).trim())
    expect(root.querySelector('h1')?.textContent).toBe(AppIdentity.name)
    app.unmount()
  })

  test('AC-tasks-2: shows loading, then the error state; Retry loads the tasks', async () => {
    const repository = new FakeTasksRepository()
    repository.waiting.add('list')
    repository.failing.add('list')
    const { app, root } = await renderTasks(repository)
    expect(byTestId(root, 'tasks.loading')?.getAttribute('role')).toBe('status')

    repository.release()
    await settle()
    expect(byTestId(root, 'tasks.loading')).toBeNull()
    expect(byTestId(root, 'tasks.error')?.textContent).toContain(strings.tasksErrorTitle)

    repository.failing.clear()
    repository.waiting.clear()
    await click(byTestId(root, 'tasks.retryButton'))
    expect(byTestId(root, 'tasks.error')).toBeNull()
    expect(rowIds(root)).toHaveLength(4)
    app.unmount()
  })

  test('AC-tasks-3: with no tasks and no filter, the empty state shows a New task button', async () => {
    const { app, root } = await renderTasks(new FakeTasksRepository([]))
    expect(byTestId(root, 'tasks.empty')?.textContent).toContain(strings.tasksEmptyTitle)
    await click(byTestId(root, 'tasks.emptyAddButton'))
    expect(app.router.state.location.pathname).toBe('/tasks/new')
    app.unmount()
  })

  test('AC-tasks-4: a status filter requests only that status; All requests every status', async () => {
    const { app, root, repository } = await renderTasks()
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: undefined, priority: undefined }])

    await click(statusRadio(root, 'todo'))
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: 'todo', priority: undefined }])
    expect(rowIds(root).sort()).toEqual(['sample-2', 'sample-3'])

    await click(statusRadio(root, 'all'))
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: undefined, priority: undefined }])
    expect(rowIds(root)).toHaveLength(4)
    app.unmount()
  })

  test('AC-tasks-5: a priority filter requests only that priority, combined with the status filter', async () => {
    const { app, root, repository } = await renderTasks()
    const priority = byTestId(root, 'tasks.priorityFilter')
    expect(priority?.getAttribute('aria-label')).toBe(strings.tasksFilterPriority)

    await selectOption(priority, 'high')
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: undefined, priority: 'high' }])
    expect(rowIds(root).sort()).toEqual(['sample-1', 'sample-2'])

    await click(statusRadio(root, 'inProgress'))
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: 'inProgress', priority: 'high' }])
    expect(rowIds(root)).toEqual(['sample-1'])
    app.unmount()
  })

  test('AC-tasks-6: a filter that matches nothing shows filtered-empty; Clear filters shows every task', async () => {
    const { app, root, repository } = await renderTasks()
    await click(statusRadio(root, 'done'))
    await selectOption(byTestId(root, 'tasks.priorityFilter'), 'high')
    expect(byTestId(root, 'tasks.emptyFiltered')?.textContent).toContain(strings.tasksEmptyFilteredTitle)

    await click(byTestId(root, 'tasks.clearFilters'))
    expect(repository.callsTo('list').at(-1)).toEqual([{ status: undefined, priority: undefined }])
    expect(rowIds(root)).toHaveLength(4)
    expect((statusRadio(root, 'all') as HTMLInputElement).checked).toBe(true)
    expect((byTestId(root, 'tasks.priorityFilter') as HTMLSelectElement).value).toBe('any')
    app.unmount()
  })

  test("AC-tasks-7: an open task's toggle marks it Done, a Done task's marks it To do, saved with updateTaskStatus", async () => {
    const { app, root, repository } = await renderTasks()
    const toggle = byTestId(root, 'tasks.row.sample-2.toggle')
    expect(toggle?.getAttribute('aria-label')).toBe(strings.taskMarkDone)

    repository.waiting.add('updateStatus')
    await click(toggle)
    // Changed at once, before the server answers.
    expect(byTestId(root, 'tasks.row.sample-2')?.textContent).toContain(strings.taskStatusDone)
    expect(byTestId(root, 'tasks.row.sample-2.toggle')?.getAttribute('aria-label')).toBe(strings.taskMarkTodo)
    repository.waiting.clear()
    repository.release()
    await settle()
    expect(repository.callsTo('updateStatus')).toEqual([['sample-2', 'done']])

    await click(byTestId(root, 'tasks.row.sample-4.toggle'))
    expect(repository.callsTo('updateStatus').at(-1)).toEqual(['sample-4', 'todo'])
    expect(byTestId(root, 'tasks.row.sample-4')?.textContent).toContain(strings.taskStatusTodo)
    app.unmount()
  })

  test('AC-tasks-8: when saving a toggle fails, the row returns to its status and the error shows', async () => {
    const repository = new FakeTasksRepository()
    repository.failing.add('updateStatus')
    const { app, root } = await renderTasks(repository)

    await click(byTestId(root, 'tasks.row.sample-1.toggle'))
    expect(byTestId(root, 'tasks.row.sample-1')?.textContent).toContain(strings.taskStatusInProgress)
    const message = byTestId(root, 'tasks.updateError')
    expect(message?.getAttribute('role')).toBe('alert')
    expect(message?.textContent).toBe(strings.tasksUpdateError)
    app.unmount()
  })

  test('AC-tasks-9: an overdue open task shows Overdue; done or future tasks do not', async () => {
    const { app, root } = await renderTasks()
    expect(byTestId(root, 'tasks.row.sample-2')?.textContent).toContain(strings.taskOverdue)
    expect(byTestId(root, 'tasks.row.sample-1')?.textContent).not.toContain(strings.taskOverdue)
    expect(byTestId(root, 'tasks.row.sample-4')?.textContent).not.toContain(strings.taskOverdue)
    app.unmount()
  })

  test('AC-tasks-10: tapping a row opens its Task detail, and New task opens the editor', async () => {
    const { app, root } = await renderTasks()
    await click(byTestId(root, 'tasks.row.sample-3')!.querySelector('a'))
    expect(app.router.state.location.pathname).toBe('/tasks/sample-3')
    expect(byTestId(root, 'taskDetail.taskTitle')?.textContent).toBe('Prepare slides for the all-hands')

    await app.router.navigate({ to: '/' })
    await settle()
    await click(byTestId(root, 'tasks.addButton'))
    expect(app.router.state.location.pathname).toBe('/tasks/new')
    expect(root.querySelector('h1')?.textContent).toBe(strings.taskEditorNewTitle)
    app.unmount()
  })

  test('AC-tasks-11: the Settings entry point opens Settings', async () => {
    const { app, root } = await renderTasks()
    const entry = byTestId(root, 'tasks.openSettings')
    expect(entry?.getAttribute('aria-label')).toBe(strings.tasksOpenSettings)
    await click(entry)
    expect(app.router.state.location.pathname).toBe('/settings')
    expect(root.querySelector('h1')?.textContent).toBe(strings.settingsTitle)
    app.unmount()
  })

  test('AC-tasks-12: the count caption shows the number of tasks in the list', async () => {
    const { app, root } = await renderTasks()
    expect(byTestId(root, 'tasks.count')?.textContent).toBe(strings.tasksCount(4))
    await click(statusRadio(root, 'todo'))
    expect(byTestId(root, 'tasks.count')?.textContent).toBe(strings.tasksCount(2))
    app.unmount()
  })
})
