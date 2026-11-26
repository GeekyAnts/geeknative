import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { AppConfig } from '#/generated/config'
import { strings } from '#/generated/strings'
import { FakeTasksRepository } from '#/testing/FakeTasksRepository'
import { ApiTasksRepository } from './ApiTasksRepository'
import { InMemoryTasksRepository } from './InMemoryTasksRepository'
import type { TaskItem } from './Task'
import { addDays, isOverdue, parseLocalDate, toLocalDateString } from './TaskDates'
import { taskSamples } from './TaskSamples'
import { TaskNotFoundError } from './TasksRepository'
import { tasksQuery } from './taskQueries'
import { filterFor, tasksState, toggleTaskStatus } from './useTasksViewModel'

const today = new Date(2026, 10, 18, 9, 30)
const task = (overrides: Partial<TaskItem> = {}): TaskItem => ({
  id: 't1',
  title: 'Write the report',
  notes: '',
  status: 'todo',
  priority: 'medium',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
})

describe('Task dates', () => {
  test('AC-tasks-9: a due date is a local calendar date, not UTC midnight', () => {
    const date = parseLocalDate('2026-11-19')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 19, 0])
    expect(toLocalDateString(date)).toBe('2026-11-19')
    expect(toLocalDateString(addDays(today, -18))).toBe('2026-10-31')
  })

  test('AC-tasks-9: only an open task due before today is overdue', () => {
    expect(isOverdue(task({ dueDate: '2026-11-17' }), today)).toBe(true)
    expect(isOverdue(task({ status: 'inProgress', dueDate: '2026-11-17' }), today)).toBe(true)
    expect(isOverdue(task({ status: 'done', dueDate: '2026-11-17' }), today)).toBe(false)
    expect(isOverdue(task({ dueDate: '2026-11-18' }), today)).toBe(false)
    expect(isOverdue(task({ dueDate: '2026-11-19' }), today)).toBe(false)
    expect(isOverdue(task(), today)).toBe(false)
  })
})

describe('Tasks state', () => {
  test('AC-tasks-2: loading first, the error state after a failed load, loading again on Retry', () => {
    expect(tasksState({ data: undefined, isError: false, isFetching: true }, {})).toEqual({ kind: 'loading' })
    expect(tasksState({ data: undefined, isError: true, isFetching: false }, {})).toEqual({ kind: 'error' })
    expect(tasksState({ data: undefined, isError: true, isFetching: true }, {})).toEqual({ kind: 'loading' })
  })

  test('AC-tasks-3: no tasks and no filter is the empty state', () => {
    expect(tasksState({ data: [], isError: false, isFetching: false }, {})).toEqual({ kind: 'empty' })
  })

  test('AC-tasks-6: no tasks with a filter set is the filtered-empty state', () => {
    expect(tasksState({ data: [], isError: false, isFetching: false }, filterFor('done', 'any'))).toEqual({ kind: 'emptyFiltered' })
    expect(tasksState({ data: [], isError: false, isFetching: false }, filterFor('all', 'low'))).toEqual({ kind: 'emptyFiltered' })
  })

  test('AC-tasks-4: All and Any priority send no filter', () => {
    expect(filterFor('all', 'any')).toEqual({ status: undefined, priority: undefined })
    expect(filterFor('inProgress', 'high')).toEqual({ status: 'inProgress', priority: 'high' })
  })
})

describe('Toggling a task', () => {
  test('AC-tasks-7: the row changes at once and the change is saved with updateTaskStatus', async () => {
    const repository = new FakeTasksRepository(taskSamples(today))
    repository.waiting.add('updateStatus')
    const queryClient = new QueryClient()
    const { queryKey } = tasksQuery(repository, {})
    const tasks = await queryClient.fetchQuery(tasksQuery(repository, {}))
    const open = tasks.find((candidate) => candidate.id === 'sample-1')!

    const saving = toggleTaskStatus(queryClient, repository, {}, open)
    expect(queryClient.getQueryData(queryKey)?.find((candidate) => candidate.id === 'sample-1')?.status).toBe('done')
    repository.waiting.clear()
    repository.release()
    expect(await saving).toBe(true)
    expect(repository.callsTo('updateStatus')).toEqual([['sample-1', 'done']])

    const done = queryClient.getQueryData(queryKey)!.find((candidate) => candidate.id === 'sample-4')!
    await toggleTaskStatus(queryClient, repository, {}, done)
    expect(repository.callsTo('updateStatus')).toContainEqual(['sample-4', 'todo'])
  })

  test('AC-tasks-8: when saving fails, the row returns to its previous status', async () => {
    const repository = new FakeTasksRepository(taskSamples(today))
    repository.failing.add('updateStatus')
    const queryClient = new QueryClient()
    const tasks = await queryClient.fetchQuery(tasksQuery(repository, {}))
    const open = tasks.find((candidate) => candidate.id === 'sample-1')!

    expect(await toggleTaskStatus(queryClient, repository, {}, open)).toBe(false)
    expect(queryClient.getQueryData(tasksQuery(repository, {}).queryKey)?.find((candidate) => candidate.id === 'sample-1')?.status).toBe('inProgress')
    expect(strings.tasksUpdateError).toBeTruthy()
  })
})

describe('InMemoryTasksRepository', () => {
  test('AC-tasks-5: filters by status and priority together, like the server', async () => {
    const repository = new InMemoryTasksRepository(taskSamples(today))
    expect((await repository.list({ priority: 'high' })).map((t) => t.id).sort()).toEqual(['sample-1', 'sample-2'])
    expect((await repository.list({ status: 'todo', priority: 'high' })).map((t) => t.id)).toEqual(['sample-2'])
    expect(await repository.list({ status: 'done', priority: 'high' })).toEqual([])
  })

  test('AC-tasks-1: the sample tasks match the spec, with dates relative to today', () => {
    const samples = taskSamples(today)
    expect(samples.map((t) => [t.id, t.status, t.priority, t.dueDate])).toEqual([
      ['sample-1', 'inProgress', 'high', '2026-11-19'],
      ['sample-2', 'todo', 'high', '2026-11-17'],
      ['sample-3', 'todo', 'medium', '2026-11-21'],
      ['sample-4', 'done', 'low', undefined],
    ])
  })

  test('AC-task-detail-4: a missing task is not found', async () => {
    await expect(new InMemoryTasksRepository([]).get('nope')).rejects.toBeInstanceOf(TaskNotFoundError)
  })
})

describe('ApiTasksRepository', () => {
  const fetchMock = vi.fn<typeof fetch>()

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce(new Response(body === undefined ? null : JSON.stringify(body), { status }))
    vi.stubGlobal('fetch', fetchMock)
  }

  const lastRequest = () => {
    const [url, init] = fetchMock.mock.calls.at(-1)!
    return { url: String(url), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined }
  }

  const base = AppConfig.apiBaseUrl.replace(/\/$/, '')

  test('AC-tasks-4: lists tasks with listTasks, sending the status filter', async () => {
    respond(200, [task()])
    expect(await new ApiTasksRepository().list({ status: 'inProgress' })).toEqual([task()])
    expect(lastRequest()).toMatchObject({ url: `${base}/tasks?status=inProgress`, method: 'GET' })

    respond(200, [])
    await new ApiTasksRepository().list({})
    expect(lastRequest().url).toBe(`${base}/tasks`)
  })

  test('AC-tasks-5: sends the priority filter combined with the status filter', async () => {
    respond(200, [])
    await new ApiTasksRepository().list({ status: 'todo', priority: 'high' })
    expect(lastRequest().url).toBe(`${base}/tasks?status=todo&priority=high`)
  })

  test('AC-tasks-7: saves a status with updateTaskStatus (PATCH)', async () => {
    respond(200, task({ status: 'done' }))
    expect((await new ApiTasksRepository().updateStatus('t1', 'done')).status).toBe('done')
    expect(lastRequest()).toEqual({ url: `${base}/tasks/t1/status`, method: 'PATCH', body: { status: 'done' } })
  })

  test('AC-task-detail-4: loads a task with getTask, and a 404 is not found', async () => {
    respond(200, task())
    expect(await new ApiTasksRepository().get('t1')).toEqual(task())
    expect(lastRequest()).toMatchObject({ url: `${base}/tasks/t1`, method: 'GET' })

    respond(404, { code: 'notFound', message: 'No such task' })
    await expect(new ApiTasksRepository().get('gone')).rejects.toBeInstanceOf(TaskNotFoundError)

    respond(500, { code: 'internal', message: 'Boom' })
    await expect(new ApiTasksRepository().get('t1')).rejects.not.toBeInstanceOf(TaskNotFoundError)
  })

  test('AC-task-detail-3: deletes a task with deleteTask (DELETE)', async () => {
    respond(204, undefined)
    await new ApiTasksRepository().delete('t1')
    expect(lastRequest()).toMatchObject({ url: `${base}/tasks/t1`, method: 'DELETE' })
  })

  test('AC-task-editor-3: creates a task with createTask (POST)', async () => {
    const input = { title: 'New', notes: '', status: 'todo' as const, priority: 'medium' as const, dueDate: '2026-11-20' }
    respond(201, task({ ...input, id: 't2' }))
    expect((await new ApiTasksRepository().create(input)).id).toBe('t2')
    expect(lastRequest()).toEqual({ url: `${base}/tasks`, method: 'POST', body: input })
  })

  test('AC-task-editor-4: replaces a task with updateTask (PUT)', async () => {
    const input = { title: 'Edited', notes: 'More', status: 'inProgress' as const, priority: 'high' as const }
    respond(200, task(input))
    await new ApiTasksRepository().update('t1', input)
    expect(lastRequest()).toEqual({ url: `${base}/tasks/t1`, method: 'PUT', body: input })
  })
})
