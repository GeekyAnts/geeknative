import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { strings } from '#/generated/strings'
import type { IconComponent } from '#/features/catalog/Labels'
import { primaryButtonClass } from './Buttons'

/** Spinner that replaces a button's label while it's busy. */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-icon-md rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin ${className}`}
    />
  )
}

/** Full-radius `espresso` button with an optional leading icon; a progress indicator replaces the label while busy. */
export function PrimaryButton({
  children,
  icon: Icon,
  busy = false,
  testId,
  className = '',
  variantClass = primaryButtonClass,
  ...props
}: {
  children: ReactNode
  icon?: IconComponent
  busy?: boolean
  testId?: string
  className?: string
  variantClass?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-busy={busy || undefined}
      className={`${variantClass} ${className}`}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy ? (
        <>
          <Spinner />
          <span className="sr-only">{strings.commonLoading}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="size-icon-sm" />}
          {children}
        </>
      )}
    </button>
  )
}
