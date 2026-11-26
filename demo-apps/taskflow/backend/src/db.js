import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  notes       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL CHECK (status IN ('todo', 'inProgress', 'done')),
  priority    TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_status_priority ON tasks (status, priority);
`

/**
 * Opens (and creates if needed) the SQLite database. Pass ":memory:" for a throwaway one.
 * @param {string} file
 */
export function openDatabase(file) {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec(SCHEMA)
  return db
}
