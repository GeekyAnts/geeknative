import type { ReactNode } from 'react'

/** A centered empty or error state: icon, title, body and an optional action (DESIGN.md: Empty and error states). */
export function StateMessage({
  icon,
  title,
  body,
  action,
  testId,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
  testId?: string
}) {
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-sm py-xxl text-center">
      {icon && <div className="text-on-surface-variant">{icon}</div>}
      <h2 className="text-title">{title}</h2>
      {body && <p className="max-w-sm text-body text-on-surface-variant">{body}</p>}
      {action && <div className="mt-md">{action}</div>}
    </div>
  )
}
