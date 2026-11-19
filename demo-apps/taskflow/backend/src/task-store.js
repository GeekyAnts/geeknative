import { randomUUID } from 'node:crypto'

/**
 * @typedef {'todo' | 'inProgress' | 'done'} TaskStatus
 * @typedef {'low' | 'medium' | 'high'} TaskPriority
 * @typedef {{ title: string, notes: string, status: TaskStatus, priority: TaskPriority, dueDate?: string }} TaskInput
 * @typedef {TaskInput & { id: string, createdAt: string, updatedAt: string }} TaskItem
 */

// Open tasks first, then priority, then the earliest due date (none last), then newest.
const ORDER = `
ORDER BY
  CASE status WHEN 'done' THEN 1 ELSE 0 END,
  CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
  due_date IS NULL,
  due_date ASC,
  created_at DESC,
  id ASC
`

/** @returns {TaskItem} */
function toTask(row) {
  /** @type {TaskItem} */
  const task = {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  // Omitted rather than null: the generated TypeScript type is `dueDate?: string`.
  if (row.due_date) task.dueDate = row.due_date
  return task
}

export class TaskStore {
  /** @param {import('node:sqlite').DatabaseSync} db @param {() => Date} [now] */
  constructor(db, now = () => new Date()) {
    this.db = db
    this.now = now
  }

  /** @param {{ status?: TaskStatus, priority?: TaskPriority }} [filter] */
  list(filter = {}) {
    const where = []
    const params = []
    if (filter.status) {
      where.push('status = ?')
      params.push(filter.status)
    }
    if (filter.priority) {
      where.push('priority = ?')
      params.push(filter.priority)
    }
    const sql = `SELECT * FROM tasks ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ${ORDER}`
    return this.db.prepare(sql).all(...params).map(toTask)
  }

  /** @param {string} id */
  get(id) {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    return row ? toTask(row) : null
  }

  count() {
    return Number(this.db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n)
  }

  /** @param {TaskInput} input @param {{ id?: string, createdAt?: string }} [meta] */
  create(input, meta = {}) {
    const timestamp = meta.createdAt ?? this.now().toISOString()
    const id = meta.id ?? randomUUID()
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, notes, status, priority, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.title, input.notes, input.status, input.priority, input.dueDate ?? null, timestamp, timestamp)
    return this.get(id)
  }

  /** @param {string} id @param {TaskInput} input */
  update(id, input) {
    const result = this.db
      .prepare(
        `UPDATE tasks SET title = ?, notes = ?, status = ?, priority = ?, due_date = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(input.title, input.notes, input.status, input.priority, input.dueDate ?? null, this.now().toISOString(), id)
    return result.changes ? this.get(id) : null
  }

  /** @param {string} id @param {TaskStatus} status */
  updateStatus(id, status) {
    const result = this.db
      .prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, this.now().toISOString(), id)
    return result.changes ? this.get(id) : null
  }

  /** @param {string} id */
  delete(id) {
    return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0
  }

  clear() {
    this.db.exec('DELETE FROM tasks')
  }
}
