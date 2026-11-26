import type { ReactNode } from 'react'

export function EmptyState({
  title,
  body,
  testId,
  action,
}: {
  title: string
  body: string
  testId: string
  action?: ReactNode
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-md rounded-xl bg-surface p-lg shadow-low">
      <h2 className="text-title">{title}</h2>
      <p className="text-body text-on-surface-variant">{body}</p>
      {action}
    </div>
  )
}
