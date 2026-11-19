// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { toLocalDateString } from '#/features/tasks/TaskDates'
import { strings } from '#/generated/strings'
import { FakeTasksRepository } from '#/testing/FakeTasksRepository'
import { click, renderApp, settle, testContainer, typeText } from '#/testing/renderApp'

const byTestId = (root: ParentNode, id: string) => root.querySelector(`[data-testid="${id}"]`)
const field = (root: ParentNode, id: string) => byTestId(root, id) as HTMLInputElement
const checked = (root: ParentNode, group: string) =>
  root.querySelector<HTMLInputElement>(`[data-testid="${group}"] input:checked`)?.value
const radio = (root: ParentNode, group: string, value: string) => root.querySelector(`[data-testid="${group}"] input[value="${value}"]`)
const saveButton = (root: ParentNode) => byTestId(root, 'taskEditor.saveButton') as HTMLButtonElement

async function renderEditor(path: string, repository = new FakeTasksRepository()) {
  const app = await renderApp(path, testContainer({ tasksRepository: repository }))
  await settle()
  return { app, repository, root: app.element }
}

describe('Task editor', () => {
  test('AC-task-editor-1: New task opens the editor empty, To do, Medium, with no due date', async () => {
    const { app, root } = await renderEditor('/')
    await click(byTestId(root, 'tasks.addButton'))

    expect(app.router.state.location.pathname).toBe('/tasks/new')
    expect(root.querySelector('h1')?.textContent).toBe(strings.taskEditorNewTitle)
    expect(field(root, 'taskEditor.titleField').value).toBe('')
    expect(document.activeElement).toBe(field(root, 'taskEditor.titleField'))
    expect(field(root, 'taskEditor.notesField').value).toBe('')
    expect(checked(root, 'taskEditor.status')).toBe('todo')
    expect(checked(root, 'taskEditor.priority')).toBe('medium')
    expect(field(root, 'taskEditor.dueDateToggle').checked).toBe(false)
    expect(byTestId(root, 'taskEditor.dueDate')).toBeNull()
    expect(saveButton(root).disabled).toBe(true)
    app.unmount()
  })

  test('AC-task-editor-2: Save is disabled and the message shows for an empty or too long title, or too long notes', async () => {
    const { app, root } = await renderEditor('/tasks/new')
    expect(byTestId(root, 'taskEditor.titleError')).toBeNull()

    await typeText(byTestId(root, 'taskEditor.titleField'), 'Draft')
    expect(saveButton(root).disabled).toBe(false)
    await typeText(byTestId(root, 'taskEditor.titleField'), '   ')
    expect(byTestId(root, 'taskEditor.titleError')?.textContent).toBe(strings.taskEditorTitleRequired)
    expect(saveButton(root).disabled).toBe(true)

    await typeText(byTestId(root, 'taskEditor.titleField'), 'x'.repeat(121))
    expect(byTestId(root, 'taskEditor.titleError')?.textContent).toBe(strings.taskEditorTitleTooLong)
    expect(saveButton(root).disabled).toBe(true)

    await typeText(byTestId(root, 'taskEditor.titleField'), 'Fine')
    await typeText(byTestId(root, 'taskEditor.notesField'), 'n'.repeat(2001))
    expect(byTestId(root, 'taskEditor.notesError')?.textContent).toBe(strings.taskEditorNotesTooLong)
    expect(saveButton(root).disabled).toBe(true)
    app.unmount()
  })

  test('AC-task-editor-3: saving a new task sends it with createTask and returns to Tasks, which lists it', async () => {
    const { app, root, repository } = await renderEditor('/tasks/new')
    await typeText(byTestId(root, 'taskEditor.titleField'), '  Call the bank  ')
    await typeText(byTestId(root, 'taskEditor.notesField'), ' About the card ')
    await click(radio(root, 'taskEditor.status', 'inProgress'))
    await click(radio(root, 'taskEditor.priority', 'high'))
    await click(byTestId(root, 'taskEditor.dueDateToggle'))
    await typeText(byTestId(root, 'taskEditor.dueDate'), '2026-12-24')
    await click(saveButton(root))
    await settle()

    expect(repository.callsTo('create')).toEqual([
      [{ title: 'Call the bank', notes: 'About the card', status: 'inProgress', priority: 'high', dueDate: '2026-12-24' }],
    ])
    expect(app.router.state.location.pathname).toBe('/')
    expect(byTestId(root, 'tasks.list')?.textContent).toContain('Call the bank')
    app.unmount()
  })

  test('AC-task-editor-4: editing starts with the task, and saving sends the changes with updateTask', async () => {
    const { app, root, repository } = await renderEditor('/tasks/sample-1/edit')
    expect(root.querySelector('h1')?.textContent).toBe(strings.taskEditorEditTitle)
    expect(field(root, 'taskEditor.titleField').value).toBe('Finalize Q4 product roadmap')
    expect(checked(root, 'taskEditor.status')).toBe('inProgress')
    expect(checked(root, 'taskEditor.priority')).toBe('high')
    expect(field(root, 'taskEditor.dueDateToggle').checked).toBe(true)
    const dueDate = field(root, 'taskEditor.dueDate').value

    await typeText(byTestId(root, 'taskEditor.titleField'), 'Finalize Q1 roadmap')
    await click(radio(root, 'taskEditor.priority', 'low'))
    await click(saveButton(root))
    await settle()

    expect(repository.callsTo('update')).toEqual([
      ['sample-1', { title: 'Finalize Q1 roadmap', notes: '', status: 'inProgress', priority: 'low', dueDate }],
    ])
    expect(app.router.state.location.pathname).toBe('/tasks/sample-1')
    expect(byTestId(root, 'taskDetail.taskTitle')?.textContent).toBe('Finalize Q1 roadmap')
    app.unmount()
  })

  test("AC-task-editor-5: the due date switch picks today's date, and off saves the task without one", async () => {
    const { app, root, repository } = await renderEditor('/tasks/new')
    await typeText(byTestId(root, 'taskEditor.titleField'), 'Water the plants')
    await click(byTestId(root, 'taskEditor.dueDateToggle'))
    expect(field(root, 'taskEditor.dueDate').value).toBe(toLocalDateString(new Date()))
    await click(byTestId(root, 'taskEditor.dueDateToggle'))
    expect(byTestId(root, 'taskEditor.dueDate')).toBeNull()
    await click(saveButton(root))

    expect(repository.callsTo('create')[0][0]).not.toHaveProperty('dueDate')
    app.unmount()

    const edit = await renderEditor('/tasks/sample-3/edit')
    await click(byTestId(edit.root, 'taskEditor.dueDateToggle'))
    await click(saveButton(edit.root))
    expect(edit.repository.callsTo('update')[0][1]).not.toHaveProperty('dueDate')
    edit.app.unmount()
  })

  test('AC-task-editor-6: Save is disabled while saving; a failure shows the error and keeps every field', async () => {
    const repository = new FakeTasksRepository()
    repository.waiting.add('create')
    repository.failing.add('create')
    const { app, root } = await renderEditor('/tasks/new', repository)
    await typeText(byTestId(root, 'taskEditor.titleField'), 'Pay rent')
    await typeText(byTestId(root, 'taskEditor.notesField'), 'Before the 1st')
    await click(radio(root, 'taskEditor.priority', 'high'))

    await click(saveButton(root))
    expect(saveButton(root).disabled).toBe(true)
    expect(field(root, 'taskEditor.titleField').closest('fieldset')?.disabled).toBe(true)

    repository.release()
    await settle()
    expect(byTestId(root, 'taskEditor.saveError')?.textContent).toBe(strings.taskEditorSaveError)
    expect(field(root, 'taskEditor.titleField').value).toBe('Pay rent')
    expect(field(root, 'taskEditor.notesField').value).toBe('Before the 1st')
    expect(checked(root, 'taskEditor.priority')).toBe('high')
    expect(saveButton(root).disabled).toBe(false)
    expect(app.router.state.location.pathname).toBe('/tasks/new')
    app.unmount()
  })

  test('AC-task-editor-7: Cancel closes the editor without saving', async () => {
    const { app, root, repository } = await renderEditor('/tasks/new')
    await typeText(byTestId(root, 'taskEditor.titleField'), 'Never mind')
    await click(byTestId(root, 'taskEditor.cancelButton'))
    expect(app.router.state.location.pathname).toBe('/')
    expect(repository.callsTo('create')).toEqual([])
    app.unmount()

    const edit = await renderEditor('/tasks/sample-2/edit')
    await typeText(byTestId(edit.root, 'taskEditor.titleField'), 'Changed')
    await click(byTestId(edit.root, 'taskEditor.cancelButton'))
    expect(edit.app.router.state.location.pathname).toBe('/tasks/sample-2')
    expect(edit.repository.callsTo('update')).toEqual([])
    expect(byTestId(edit.root, 'taskDetail.taskTitle')?.textContent).toBe('Fix crash when uploading large attachments')
    edit.app.unmount()
  })

  test('AC-task-editor-4: a failed load shows the error with Retry', async () => {
    const repository = new FakeTasksRepository()
    repository.failing.add('get')
    const { app, root } = await renderEditor('/tasks/sample-1/edit', repository)
    expect(byTestId(root, 'taskEditor.error')?.textContent).toContain(strings.taskDetailErrorTitle)
    repository.failing.clear()
    await click(byTestId(root, 'taskEditor.retryButton'))
    expect(field(root, 'taskEditor.titleField').value).toBe('Finalize Q4 product roadmap')
    app.unmount()
  })
})
