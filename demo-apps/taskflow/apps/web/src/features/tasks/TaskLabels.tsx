import type { ReactNode } from 'react'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { priorityLabel, type TaskPriority, type TaskStatus } from './Task'

const priorityColor: Record<TaskPriority, string> = {
  high: 'text-error',
  medium: 'text-warning',
  low: 'text-on-surface-variant',
}

/** The priority with its icon, in its role color: High `error`, Medium `warning`, Low neutral. */
export function PriorityLabel({ priority, testId }: { priority: TaskPriority; testId?: string }) {
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-xs ${priorityColor[priority]}`}>
      <AppIcons.priority aria-hidden className="size-icon-sm" />
      <span>{priorityLabel(priority)}</span>
    </span>
  )
}

/** The status icon: To do, In progress, or Done in `success`. */
export function StatusIcon({ status, className = '' }: { status: TaskStatus; className?: string }) {
  const { Icon, color } = statusIcons[status]
  return <Icon aria-hidden className={`${color} ${className}`} />
}

const statusIcons = {
  todo: { Icon: AppIcons.statusTodo, color: '' },
  inProgress: { Icon: AppIcons.statusInProgress, color: 'text-primary' },
  done: { Icon: AppIcons.statusDone, color: 'text-success' },
} satisfies Record<TaskStatus, { Icon: (props: { className?: string; 'aria-hidden'?: boolean }) => ReactNode; color: string }>

/** "Overdue" before a date, both in `error`, when the task is overdue. */
export function DueDateText({ text, overdue }: { text: string; overdue: boolean }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-xs ${overdue ? 'text-error' : ''}`}>
      <AppIcons.dueDate aria-hidden className="size-icon-sm" />
      {overdue && <span>{strings.taskOverdue}</span>}
      <span>{text}</span>
    </span>
  )
}
