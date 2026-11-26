import { readFileSync } from 'node:fs'
import express from 'express'
import { parseListFilter, parseStatus, parseTaskInput, ValidationError } from './validation.js'

/** @param {import('express').Response} res @param {number} status @param {'validation' | 'notFound' | 'internal'} code @param {string} message */
function sendError(res, status, code, message) {
  res.status(status).json({ code, message })
}

/**
 * The Taskflow API, exactly as contracts/api.json describes it.
 * @param {{ store: import('./task-store.js').TaskStore, openApiPath?: string, log?: boolean }} options
 */
export function createApp({ store, openApiPath, log = false }) {
  const app = express()
  app.disable('x-powered-by')

  if (log) {
    app.use((req, res, next) => {
      const start = Date.now()
      res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`))
      next()
    })
  }

  // Any origin: the web app runs on its own dev and preview ports, and there are no cookies.
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })

  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => res.json({ status: 'ok', tasks: store.count() }))

  if (openApiPath) {
    app.get('/openapi.json', (_req, res) => res.type('application/json').send(readFileSync(openApiPath, 'utf8')))
  }

  app.get('/tasks', (req, res) => {
    res.json(store.list(parseListFilter(/** @type {Record<string, unknown>} */ (req.query))))
  })

  app.post('/tasks', (req, res) => {
    res.status(201).json(store.create(parseTaskInput(req.body)))
  })

  app.get('/tasks/:taskId', (req, res) => {
    const task = store.get(req.params.taskId)
    if (!task) return sendError(res, 404, 'notFound', 'No task has this id.')
    res.json(task)
  })

  app.put('/tasks/:taskId', (req, res) => {
    const task = store.update(req.params.taskId, parseTaskInput(req.body))
    if (!task) return sendError(res, 404, 'notFound', 'No task has this id.')
    res.json(task)
  })

  app.patch('/tasks/:taskId/status', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const task = store.updateStatus(req.params.taskId, parseStatus(body.status))
    if (!task) return sendError(res, 404, 'notFound', 'No task has this id.')
    res.json(task)
  })

  app.delete('/tasks/:taskId', (req, res) => {
    if (!store.delete(req.params.taskId)) return sendError(res, 404, 'notFound', 'No task has this id.')
    res.sendStatus(204)
  })

  app.use((_req, res) => sendError(res, 404, 'notFound', 'No such endpoint.'))

  // Express needs all four arguments to treat this as the error handler.
  app.use((err, _req, res, _next) => {
    if (err instanceof ValidationError) return sendError(res, 400, 'validation', err.message)
    if (err?.type === 'entity.parse.failed') return sendError(res, 400, 'validation', 'The body is not valid JSON.')
    console.error(err)
    sendError(res, 500, 'internal', 'Something went wrong on the server.')
  })

  return app
}
