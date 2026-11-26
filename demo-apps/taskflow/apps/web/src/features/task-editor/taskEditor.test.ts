import { describe, expect, test } from 'vitest'
import { strings } from '#/generated/strings'
import { newTaskDraft, taskInputFrom, validateDraft, withDueDate } from './useTaskEditorViewModel'

describe('Task editor logic', () => {
  test('AC-task-editor-1: a new task starts empty, To do, Medium, with no due date', () => {
    expect(newTaskDraft()).toEqual({ title: '', notes: '', status: 'todo', priority: 'medium', hasDueDate: false, dueDate: '' })
  })

  test('AC-task-editor-2: Save is disabled for an empty or too long title, or too long notes, with the message', () => {
    const draft = newTaskDraft()
    expect(validateDraft(draft, false)).toEqual({ titleError: null, notesError: null, canSave: false })
    expect(validateDraft({ ...draft, title: '   ' }, true)).toEqual({ titleError: strings.taskEditorTitleRequired, notesError: null, canSave: false })
    expect(validateDraft({ ...draft, title: 'a'.repeat(121) }, true)).toMatchObject({ titleError: strings.taskEditorTitleTooLong, canSave: false })
    expect(validateDraft({ ...draft, title: ` ${'a'.repeat(120)} ` }, true)).toEqual({ titleError: null, notesError: null, canSave: true })
    expect(validateDraft({ ...draft, title: 'Ok', notes: 'n'.repeat(2001) }, true)).toEqual({
      titleError: null,
      notesError: strings.taskEditorNotesTooLong,
      canSave: false,
    })
  })

  test('AC-task-editor-3: the task sent has trimmed text, and no due date while the switch is off', () => {
    const draft = { ...newTaskDraft(), title: '  Call the bank ', notes: '\n about the card  ', priority: 'high' as const }
    expect(taskInputFrom(draft)).toEqual({ title: 'Call the bank', notes: 'about the card', status: 'todo', priority: 'high' })
    expect(taskInputFrom({ ...draft, hasDueDate: true, dueDate: '2026-11-20' }).dueDate).toBe('2026-11-20')
    expect(taskInputFrom({ ...draft, hasDueDate: false, dueDate: '2026-11-20' })).not.toHaveProperty('dueDate')
  })

  test("AC-task-editor-5: turning the due date on picks today's local date, unless one was chosen; off drops it", () => {
    const today = new Date(2026, 0, 5, 23, 30)
    const on = withDueDate(newTaskDraft(), true, today)
    expect(on).toMatchObject({ hasDueDate: true, dueDate: '2026-01-05' })
    expect(withDueDate({ ...on, dueDate: '2026-03-01' }, true, today).dueDate).toBe('2026-03-01')
    const off = withDueDate(on, false, today)
    expect(off.hasDueDate).toBe(false)
    expect(taskInputFrom({ ...off, title: 'x' })).not.toHaveProperty('dueDate')
  })
})
