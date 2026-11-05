import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import type { IconComponent } from '#/features/catalog/Labels'

/**
 * A labelled text field: `button` height, radius `md`, `surface` fill, `outline` hairline,
 * `primary` border when focused, `error` border and message when invalid.
 */
export function TextField({
  label,
  icon: Icon,
  error,
  hint,
  trailing,
  testId,
  className = '',
  ...props
}: {
  label: string
  icon?: IconComponent
  error?: string
  hint?: string
  trailing?: ReactNode
  testId?: string
  className?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      <label htmlFor={id} className="text-label text-on-surface-variant">
        {label}
      </label>
      <div
        className={`flex h-button items-center gap-sm rounded-md border bg-surface px-md text-on-surface motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
          error ? 'border-error' : 'border-outline'
        } ${props.disabled ? 'opacity-60' : ''}`}
      >
        {Icon && <Icon className="size-icon-md shrink-0 text-on-surface-variant" />}
        <input
          id={id}
          data-testid={testId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-on-surface-variant"
          {...props}
        />
        {trailing}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`text-caption ${error ? 'text-error' : 'text-on-surface-variant'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
