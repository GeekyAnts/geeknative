// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import type { TaskItem } from '#/features/tasks/Task'
import { formatDateTime, formatLongDate } from '#/features/tasks/TaskDates'
import { taskSamples } from '#/features/tasks/TaskSamples'
import { strings } from '#/generated/strings'
import { FakeTasksRepository } from '#/testing/FakeTasksRepository'
import { click, renderApp, settle, testContainer } from '#/testing/renderApp'

const byTestId = (root: ParentNode, id: string) => root.querySelector(`[data-testid="${id}"]`)
const checkedStatus = (root: ParentNode) =>
  root.querySelector<HTMLInputElement>('[data-testid="taskDetail.status"] input:checked')?.value
const statusRadio = (root: ParentNode, value: string) => root.querySelector(`[data-testid="taskDetail.status"] input[value="${value}"]`)
const dialogButton = (root: ParentNode, text: string) =>
  [...root.querySelectorAll('dialog button')].find((button) => button.textContent === text) ?? null

const withNotes: TaskItem = {
  id: 'notes-1',
  title: 'Book flights',
  notes: 'Window seat, morning departure',
  status: 'todo',
  priority: 'medium',
  dueDate: '2026-12-02',
  createdAt: '2026-11-10T08:15:00.000Z',
  updatedAt: '2026-11-12T16:45:00.000Z',
}

async function renderDetail(taskId: string, repository = new FakeTasksRepository([...taskSamples(), withNotes])) {
  const app = await renderApp(`/tasks/${taskId}`, testContainer({ tasksRepository: repository }))
  await settle()
  return { app, repository, root: app.element }
}

describe('Task detail', () => {
  test('AC-task-detail-1: shows title, status, priority, due date, notes and the created and updated dates', async () => {
    const { app, root } = await renderDetail('notes-1')
    expect(root.querySelector('h1')?.textContent).toBe(strings.taskDetailTitle)
    expect(byTestId(root, 'taskDetail.taskTitle')?.textContent).toBe('Book flights')
    expect(checkedStatus(root)).toBe('todo')
    expect(byTestId(root, 'taskDetail.status')?.getAttribute('role')).toBe('radiogroup')
    expect(byTestId(root, 'taskDetail.priority')?.textContent).toBe(strings.taskPriorityMedium)
    expect(byTestId(root, 'taskDetail.dueDate')?.textContent).toContain(formatLongDate('2026-12-02'))
    expect(byTestId(root, 'taskDetail.notes')?.textContent).toBe('Window seat, morning departure')
    expect(byTestId(root, 'taskDetail.created')?.textContent).toBe(strings.taskDetailCreated({ date: formatDateTime(withNotes.createdAt) }))
    expect(byTestId(root, 'taskDetail.updated')?.textContent).toBe(strings.taskDetailUpdated({ date: formatDateTime(withNotes.updatedAt) }))
    app.unmount()

    const empty = await renderDetail('sample-4')
    expect(byTestId(empty.root, 'taskDetail.dueDate')?.textContent).toBe(strings.taskDetailNoDueDate)
    expect(byTestId(empty.root, 'taskDetail.notes')?.textContent).toBe(strings.taskDetailNoNotes)
    expect(checkedStatus(empty.root)).toBe('done')
    empty.app.unmount()

    const overdue = await renderDetail('sample-2')
    expect(byTestId(overdue.root, 'taskDetail.dueDate')?.textContent).toContain(strings.taskOverdue)
    overdue.app.unmount()
  })

  test('AC-task-detail-2: choosing a status saves it and shows the returned task; on failure the previous status returns', async () => {
    const { app, root, repository } = await renderDetail('notes-1')
    const before = byTestId(root, 'taskDetail.updated')?.textContent

    repository.waiting.add('updateStatus')
    await click(statusRadio(root, 'inProgress'))
    expect(checkedStatus(root)).toBe('inProgress')
    expect((statusRadio(root, 'done') as HTMLInputElement).disabled).toBe(true)
    expect((byTestId(root, 'taskDetail.deleteButton') as HTMLButtonElement).disabled).toBe(true)
    repository.waiting.clear()
    repository.release()
    await settle()
    expect(repository.callsTo('updateStatus')).toEqual([['notes-1', 'inProgress']])
    expect(byTestId(root, 'taskDetail.updated')?.textContent).not.toBe(before)
    expect((statusRadio(root, 'done') as HTMLInputElement).disabled).toBe(false)

    repository.failing.add('updateStatus')
    await click(statusRadio(root, 'done'))
    expect(checkedStatus(root)).toBe('inProgress')
    expect(byTestId(root, 'taskDetail.message')?.textContent).toBe(strings.taskDetailUpdateError)
    expect(byTestId(root, 'taskDetail.message')?.getAttribute('role')).toBe('alert')
    app.unmount()
  })

  test('AC-task-detail-3: Delete asks first; Cancel keeps the task, confirming deletes it and returns to Tasks', async () => {
    const { app, root, repository } = await renderDetail('sample-3')
    const dialog = root.querySelector('dialog')!

    await click(byTestId(root, 'taskDetail.deleteButton'))
    expect(dialog.open).toBe(true)
    expect(dialog.textContent).toContain(strings.taskDetailDeleteConfirmTitle)
    expect(dialog.textContent).toContain(strings.taskDetailDeleteConfirmMessage)
    await click(dialogButton(root, strings.commonCancel))
    expect(dialog.open).toBe(false)
    expect(repository.callsTo('delete')).toEqual([])
    expect(app.router.state.location.pathname).toBe('/tasks/sample-3')

    await click(byTestId(root, 'taskDetail.deleteButton'))
    await click(byTestId(root, 'taskDetail.confirmDelete'))
    await settle()
    expect(repository.callsTo('delete')).toEqual([['sample-3']])
    expect(app.router.state.location.pathname).toBe('/')
    expect(byTestId(root, 'tasks.row.sample-1')).not.toBeNull()
    expect(byTestId(root, 'tasks.row.sample-3')).toBeNull()
    app.unmount()
  })

  test('AC-task-detail-4: loading, then the error state with Retry; a 404 shows not found', async () => {
    const repository = new FakeTasksRepository()
    repository.waiting.add('get')
    repository.failing.add('get')
    const { app, root } = await renderDetail('sample-1', repository)
    expect(byTestId(root, 'taskDetail.loading')?.getAttribute('role')).toBe('status')

    repository.release()
    await settle()
    expect(byTestId(root, 'taskDetail.error')?.textContent).toContain(strings.taskDetailErrorTitle)

    repository.waiting.clear()
    repository.failing.clear()
    await click(byTestId(root, 'taskDetail.retryButton'))
    expect(byTestId(root, 'taskDetail.taskTitle')?.textContent).toBe('Finalize Q4 product roadmap')
    app.unmount()

    const missing = await renderDetail('does-not-exist')
    expect(byTestId(missing.root, 'taskDetail.notFound')?.textContent).toContain(strings.taskDetailNotFoundTitle)
    expect(byTestId(missing.root, 'taskDetail.error')).toBeNull()
    missing.app.unmount()
  })

  test('AC-task-detail-5: Edit opens the Task editor filled in with this task', async () => {
    const { app, root } = await renderDetail('notes-1')
    await click(byTestId(root, 'taskDetail.editButton'))
    expect(app.router.state.location.pathname).toBe('/tasks/notes-1/edit')
    expect(root.querySelector('h1')?.textContent).toBe(strings.taskEditorEditTitle)
    expect((byTestId(root, 'taskEditor.titleField') as HTMLInputElement).value).toBe('Book flights')
    expect((byTestId(root, 'taskEditor.notesField') as HTMLTextAreaElement).value).toBe('Window seat, morning departure')
    expect((byTestId(root, 'taskEditor.dueDate') as HTMLInputElement).value).toBe('2026-12-02')
    app.unmount()
  })

  test('AC-task-detail-6: when deleting fails, the user stays on Task detail and the error shows', async () => {
    const repository = new FakeTasksRepository()
    repository.failing.add('delete')
    const { app, root } = await renderDetail('sample-1', repository)

    await click(byTestId(root, 'taskDetail.deleteButton'))
    await click(byTestId(root, 'taskDetail.confirmDelete'))
    expect(app.router.state.location.pathname).toBe('/tasks/sample-1')
    expect(byTestId(root, 'taskDetail.message')?.textContent).toBe(strings.taskDetailDeleteError)
    expect(byTestId(root, 'taskDetail.taskTitle')).not.toBeNull()
    app.unmount()
  })
})
