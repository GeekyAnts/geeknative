import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { strings } from '#/generated/strings'
import { priorityLabel, statusLabel, taskPriorities, taskStatuses, type TaskInput, type TaskItem, type TaskPriority, type TaskStatus } from '#/features/tasks/Task'
import { toLocalDateString } from '#/features/tasks/TaskDates'
import { taskQuery, taskSaved, tasksChanged } from '#/features/tasks/taskQueries'
import type { TasksRepository } from '#/features/tasks/TasksRepository'

export const TITLE_MAX_LENGTH = 120
export const NOTES_MAX_LENGTH = 2000

/** What the form holds. `dueDate` is kept while the switch is off, so turning it back on restores it. */
export interface TaskDraft {
  title: string
  notes: string
  status: TaskStatus
  priority: TaskPriority
  hasDueDate: boolean
  dueDate: string
}

export const newTaskDraft = (): TaskDraft => ({ title: '', notes: '', status: 'todo', priority: 'medium', hasDueDate: false, dueDate: '' })

export const draftFromTask = (task: TaskItem): TaskDraft => ({
  title: task.title,
  notes: task.notes,
  status: task.status,
  priority: task.priority,
  hasDueDate: task.dueDate !== undefined,
  dueDate: task.dueDate ?? '',
})

/** Turning the due date on picks today (local) unless a date was already chosen. */
export function withDueDate(draft: TaskDraft, on: boolean, today: Date = new Date()): TaskDraft {
  return on ? { ...draft, hasDueDate: true, dueDate: draft.dueDate || toLocalDateString(today) } : { ...draft, hasDueDate: false }
}

/** Validation messages, and whether Save is enabled. `titleRequired` shows only once the user has typed in the title. */
export function validateDraft(draft: TaskDraft, titleEdited: boolean) {
  const title = draft.title.trim()
  const notes = draft.notes.trim()
  const titleError =
    title.length > TITLE_MAX_LENGTH ? strings.taskEditorTitleTooLong : titleEdited && title.length === 0 ? strings.taskEditorTitleRequired : null
  const notesError = notes.length > NOTES_MAX_LENGTH ? strings.taskEditorNotesTooLong : null
  return { titleError, notesError, canSave: title.length > 0 && title.length <= TITLE_MAX_LENGTH && notesError === null }
}

/** The task to send: trimmed text, and a due date only when the switch is on. */
export function taskInputFrom(draft: TaskDraft): TaskInput {
  const input: TaskInput = { title: draft.title.trim(), notes: draft.notes.trim(), status: draft.status, priority: draft.priority }
  if (draft.hasDueDate && draft.dueDate) input.dueDate = draft.dueDate
  return input
}

/** Creates the task (no `taskId`) or replaces it, and updates the caches. */
export async function saveTask(queryClient: QueryClient, repository: TasksRepository, taskId: string | undefined, draft: TaskDraft) {
  const input = taskInputFrom(draft)
  const saved = taskId === undefined ? await repository.create(input) : await repository.update(taskId, input)
  if (taskId === undefined) tasksChanged(queryClient)
  taskSaved(queryClient, repository, saved)
  return saved
}

export type TaskEditorState = { kind: 'loading' } | { kind: 'error' } | { kind: 'editing'; draft: TaskDraft }

/** State and actions for the Task editor: a new task without `taskId`, or editing that task. */
export function useTaskEditorViewModel(taskId?: string) {
  const { container } = useRouteContext({ from: '__root__' })
  const repository = container.tasksRepository
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({ ...taskQuery(repository, taskId ?? ''), enabled: taskId !== undefined })
  const [edited, setEdited] = useState<TaskDraft | null>(null)
  const [titleEdited, setTitleEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const loaded = taskId === undefined ? newTaskDraft() : query.data && draftFromTask(query.data)
  const draft = edited ?? loaded
  const state: TaskEditorState = draft
    ? { kind: 'editing', draft }
    : query.isError && !query.isFetching
      ? { kind: 'error' }
      : { kind: 'loading' }
  const validation = validateDraft(draft ?? newTaskDraft(), titleEdited)
  const update = (change: (draft: TaskDraft) => TaskDraft) => {
    if (draft) setEdited(change(draft))
  }
  const close = () =>
    taskId === undefined ? navigate({ to: '/', replace: true }) : navigate({ to: '/tasks/$taskId', params: { taskId }, replace: true })

  return {
    state,
    isNew: taskId === undefined,
    title: taskId === undefined ? strings.taskEditorNewTitle : strings.taskEditorEditTitle,
    ...validation,
    saving,
    saveError: saveFailed ? strings.taskEditorSaveError : null,
    statusOptions: taskStatuses.map((id) => ({ id, label: statusLabel(id) })),
    priorityOptions: taskPriorities.map((id) => ({ id, label: priorityLabel(id) })),
    retry: () => void query.refetch(),
    setTitle: (title: string) => {
      setTitleEdited(true)
      update((current) => ({ ...current, title }))
    },
    setNotes: (notes: string) => update((current) => ({ ...current, notes })),
    setStatus: (status: TaskStatus) => update((current) => ({ ...current, status })),
    setPriority: (priority: TaskPriority) => update((current) => ({ ...current, priority })),
    setHasDueDate: (on: boolean) => update((current) => withDueDate(current, on)),
    setDueDate: (dueDate: string) => update((current) => ({ ...current, dueDate })),
    save: async () => {
      if (!draft || !validation.canSave || saving) return
      setSaving(true)
      setSaveFailed(false)
      try {
        await saveTask(queryClient, repository, taskId, draft)
      } catch {
        setSaving(false)
        setSaveFailed(true)
        return
      }
      await close()
    },
    cancel: () => void close(),
  }
}
