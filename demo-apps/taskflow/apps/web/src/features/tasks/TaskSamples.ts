import type { TaskItem } from './Task'
import { addDays, toLocalDateString } from './TaskDates'

/** The sample tasks for tests and previews, identical on every platform. Dates are relative to `today`. */
export function taskSamples(today: Date = new Date()): TaskItem[] {
  const timestamp = today.toISOString()
  const sample = (task: Omit<TaskItem, 'notes' | 'createdAt' | 'updatedAt'>): TaskItem => ({
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...task,
  })
  return [
    sample({ id: 'sample-1', title: 'Finalize Q4 product roadmap', status: 'inProgress', priority: 'high', dueDate: toLocalDateString(addDays(today, 1)) }),
    sample({ id: 'sample-2', title: 'Fix crash when uploading large attachments', status: 'todo', priority: 'high', dueDate: toLocalDateString(addDays(today, -1)) }),
    sample({ id: 'sample-3', title: 'Prepare slides for the all-hands', status: 'todo', priority: 'medium', dueDate: toLocalDateString(addDays(today, 3)) }),
    sample({ id: 'sample-4', title: 'Renew the SSL certificate for staging', status: 'done', priority: 'low' }),
  ]
}
