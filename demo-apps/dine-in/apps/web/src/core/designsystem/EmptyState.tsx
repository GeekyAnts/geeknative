import type { ReactNode } from 'react'
import type { IconComponent } from '#/features/catalog/Labels'
import { AppSerif } from './AppSerif'
import { PrimaryButton } from './PrimaryButton'

/** Centred `accent` icon in a `surfaceVariant` circle, serif title, body and an optional action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  onAction,
  actionTestId,
  children,
  testId,
  tone = 'background',
}: {
  icon: IconComponent
  title: string
  body: string
  action?: string
  onAction?: () => void
  actionTestId?: string
  children?: ReactNode
  testId?: string
  tone?: 'background' | 'espresso'
}) {
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-md px-lg py-xxxl text-center motion-safe:animate-fade-up">
      <div className="flex size-huge items-center justify-center rounded-full bg-surface-variant text-accent">
        <Icon className="size-icon-xl" />
      </div>
      <AppSerif role="title" as="h2" className={tone === 'espresso' ? 'text-on-espresso' : 'text-on-background'}>
        {title}
      </AppSerif>
      <p className={`max-w-sm text-body ${tone === 'espresso' ? 'text-on-espresso/80' : 'text-on-surface-variant'}`}>{body}</p>
      {action && onAction && (
        <PrimaryButton testId={actionTestId} onClick={onAction} className="mt-sm">
          {action}
        </PrimaryButton>
      )}
      {children}
    </div>
  )
}
