import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, test } from 'node:test'
import { createApp } from '../src/app.js'
import { config } from '../src/config.js'
import { openDatabase } from '../src/db.js'
import { localDateString, SEED_TASKS, seedTasks } from '../src/seed.js'
import { TaskStore } from '../src/task-store.js'

const contract = JSON.parse(readFileSync(config.openApiPath, 'utf8'))
const schemas = contract.components.schemas

/** Checks a value against a schema from contracts/api.json (the subset geeknative supports). */
function assertMatches(value, schema, where = 'body') {
  if (schema.$ref) return assertMatches(value, schemas[schema.$ref.split('/').pop()], where)
  if (schema.enum) return assert.ok(schema.enum.includes(value), `${where}: ${JSON.stringify(value)} not in ${schema.enum}`)
  if (schema.type === 'array') {
    assert.ok(Array.isArray(value), `${where} should be an array`)
    return value.forEach((item, i) => assertMatches(item, schema.items, `${where}[${i}]`))
  }
  if (schema.type === 'object' || schema.properties) {
    assert.equal(typeof value, 'object', `${where} should be an object`)
    for (const key of schema.required ?? []) assert.ok(key in value, `${where}.${key} is required`)
    for (const [key, item] of Object.entries(value)) {
      assert.ok(schema.properties[key], `${where}.${key} is not in the contract`)
      assertMatches(item, schema.properties[key], `${where}.${key}`)
    }
    return
  }
  const types = { string: 'string', integer: 'number', number: 'number', boolean: 'boolean' }
  assert.equal(typeof value, types[schema.type], `${where} should be ${schema.type}`)
}

/** The success schema of an operation in the contract. */
function responseSchema(path, method, status) {
  return contract.paths[path][method].responses[status]?.content?.['application/json']?.schema
}

const today = new Date(2026, 10, 18, 9, 30)
let store
let server
let base

before(async () => {
  store = new TaskStore(openDatabase(':memory:'), () => new Date('2026-11-18T09:30:00.000Z'))
  server = createApp({ store, openApiPath: config.openApiPath }).listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => server.close())

beforeEach(() => seedTasks(store, today))

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : undefined }
}

const ROADMAP = SEED_TASKS[0].id
const input = { title: '  Ship the beta  ', notes: ' Tell the team ', status: 'todo', priority: 'high', dueDate: '2026-12-01' }

describe('contract', () => {
  test('every operation in contracts/api.json is served', async () => {
    const operations = Object.entries(contract.paths).flatMap(([path, item]) =>
      Object.entries(item).map(([method, op]) => ({ path, method, id: op.operationId })),
    )
    assert.deepEqual(operations.map((o) => o.id).sort(), [
      'createTask',
      'deleteTask',
      'getTask',
      'listTasks',
      'updateTask',
      'updateTaskStatus',
    ])
    for (const op of operations) {
      const res = await call(op.method.toUpperCase(), op.path.replace('{taskId}', 'missing-id'), op.method === 'get' || op.method === 'delete' ? undefined : {})
      assert.notEqual(res.json?.message, 'No such endpoint.', `${op.method} ${op.path} is not routed`)
    }
  })

  test('serves the contract at /openapi.json', async () => {
    const res = await call('GET', '/openapi.json')
    assert.equal(res.status, 200)
    assert.equal(res.json.openapi, contract.openapi)
  })
})

describe('listTasks', () => {
  test('returns the seed tasks matching TaskItem, open tasks first', async () => {
    const res = await call('GET', '/tasks')
    assert.equal(res.status, 200)
    assertMatches(res.json, responseSchema('/tasks', 'get', '200'))
    assert.equal(res.json.length, SEED_TASKS.length)
    const firstDone = res.json.findIndex((t) => t.status === 'done')
    assert.ok(res.json.slice(firstDone).every((t) => t.status === 'done'))
  })

  test('sorts by priority, then earliest due date with none last, then newest', async () => {
    const res = await call('GET', '/tasks?status=todo')
    const rank = { high: 0, medium: 1, low: 2 }
    for (let i = 1; i < res.json.length; i++) {
      const [a, b] = [res.json[i - 1], res.json[i]]
      assert.ok(rank[a.priority] <= rank[b.priority], `${a.title} before ${b.title}`)
      if (a.priority === b.priority && a.dueDate && b.dueDate) assert.ok(a.dueDate <= b.dueDate)
      if (a.priority === b.priority && !a.dueDate) assert.ok(!b.dueDate)
    }
  })

  test('filters by status and priority together', async () => {
    const res = await call('GET', '/tasks?status=todo&priority=high')
    assert.ok(res.json.length > 0)
    assert.ok(res.json.every((t) => t.status === 'todo' && t.priority === 'high'))
  })

  test('rejects an unknown filter value', async () => {
    const res = await call('GET', '/tasks?status=archived')
    assert.equal(res.status, 400)
    assertMatches(res.json, responseSchema('/tasks', 'get', '400'))
  })

  test('omits dueDate when a task has none', async () => {
    const res = await call('GET', '/tasks')
    const none = res.json.find((t) => t.title === 'Schedule 1:1s for next week')
    assert.ok(!('dueDate' in none))
  })

  test('seed due dates are relative to today, with one overdue open task', async () => {
    const res = await call('GET', `/tasks/${SEED_TASKS[1].id}`)
    assert.equal(res.json.dueDate, localDateString(new Date(2026, 10, 17)))
  })
})

describe('createTask', () => {
  test('creates a trimmed task and returns 201 with a TaskItem', async () => {
    const res = await call('POST', '/tasks', input)
    assert.equal(res.status, 201)
    assertMatches(res.json, responseSchema('/tasks', 'post', '201'))
    assert.equal(res.json.title, 'Ship the beta')
    assert.equal(res.json.notes, 'Tell the team')
    assert.equal(res.json.dueDate, '2026-12-01')
    assert.equal((await call('GET', `/tasks/${res.json.id}`)).status, 200)
  })

  for (const [name, body] of [
    ['an empty title', { ...input, title: '   ' }],
    ['a title over 120 characters', { ...input, title: 'x'.repeat(121) }],
    ['notes over 2000 characters', { ...input, notes: 'x'.repeat(2001) }],
    ['missing notes', { title: 'A', status: 'todo', priority: 'low' }],
    ['an unknown status', { ...input, status: 'blocked' }],
    ['an unknown priority', { ...input, priority: 'urgent' }],
    ['an impossible date', { ...input, dueDate: '2026-02-30' }],
    ['a date with a time', { ...input, dueDate: '2026-12-01T00:00:00Z' }],
  ]) {
    test(`rejects ${name} with 400`, async () => {
      const res = await call('POST', '/tasks', body)
      assert.equal(res.status, 400)
      assert.equal(res.json.code, 'validation')
    })
  }

  test('rejects malformed JSON with 400', async () => {
    const res = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
    assert.equal(res.status, 400)
    assert.equal((await res.json()).code, 'validation')
  })
})

describe('getTask, updateTask, updateTaskStatus, deleteTask', () => {
  test('getTask returns 404 with ErrorResponse for an unknown id', async () => {
    const res = await call('GET', '/tasks/nope')
    assert.equal(res.status, 404)
    assertMatches(res.json, responseSchema('/tasks/{taskId}', 'get', '404'))
  })

  test('updateTask replaces the fields, and a missing dueDate clears it', async () => {
    const res = await call('PUT', `/tasks/${ROADMAP}`, { title: 'Roadmap v2', notes: '', status: 'done', priority: 'low' })
    assert.equal(res.status, 200)
    assertMatches(res.json, responseSchema('/tasks/{taskId}', 'put', '200'))
    assert.equal(res.json.title, 'Roadmap v2')
    assert.equal(res.json.status, 'done')
    assert.ok(!('dueDate' in res.json))
    assert.notEqual(res.json.updatedAt, res.json.createdAt)
  })

  test('updateTask returns 404 for an unknown id', async () => {
    assert.equal((await call('PUT', '/tasks/nope', input)).status, 404)
  })

  test('updateTaskStatus changes only the status', async () => {
    const before = (await call('GET', `/tasks/${ROADMAP}`)).json
    const res = await call('PATCH', `/tasks/${ROADMAP}/status`, { status: 'done' })
    assert.equal(res.status, 200)
    assertMatches(res.json, responseSchema('/tasks/{taskId}/status', 'patch', '200'))
    assert.deepEqual({ ...res.json, status: before.status, updatedAt: before.updatedAt }, before)
    assert.equal(res.json.status, 'done')
  })

  test('updateTaskStatus rejects an unknown status and an unknown id', async () => {
    assert.equal((await call('PATCH', `/tasks/${ROADMAP}/status`, { status: 'paused' })).status, 400)
    assert.equal((await call('PATCH', '/tasks/nope/status', { status: 'done' })).status, 404)
  })

  test('deleteTask returns 204, then the task is gone', async () => {
    const res = await call('DELETE', `/tasks/${ROADMAP}`)
    assert.equal(res.status, 204)
    assert.equal((await call('GET', `/tasks/${ROADMAP}`)).status, 404)
    assert.equal((await call('DELETE', `/tasks/${ROADMAP}`)).status, 404)
  })
})

describe('http', () => {
  test('allows cross-origin requests from the web app', async () => {
    const res = await fetch(`${base}/tasks`, { method: 'OPTIONS' })
    assert.equal(res.status, 204)
    assert.equal(res.headers.get('access-control-allow-origin'), '*')
    assert.match(res.headers.get('access-control-allow-methods'), /PATCH/)
  })

  test('unknown endpoints answer 404 with ErrorResponse', async () => {
    const res = await call('GET', '/nope')
    assert.equal(res.status, 404)
    assert.equal(res.json.code, 'notFound')
  })
})
