import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconComponent } from '#/features/catalog/Labels'
import { focusRing } from './Buttons'

/** Class names of a chip's visible pill: `surface` with a brass hairline, or `espresso` when selected. */
export function chipClass(selected: boolean) {
  return `inline-flex h-chip items-center gap-xs whitespace-nowrap rounded-full border px-lg text-label motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy group-active:scale-97 ${
    selected ? 'border-espresso bg-espresso text-on-espresso' : 'border-accent/40 bg-surface text-on-surface group-hover:border-accent'
  }`
}

/**
 * A toggle chip: `size.chip` tall visually, inside a 48 px touch target. Uses `aria-pressed` for its state.
 */
export function Chip({
  children,
  selected = false,
  icon: Icon,
  trailing,
  testId,
  className = '',
  ...props
}: {
  children: ReactNode
  selected?: boolean
  icon?: IconComponent
  trailing?: ReactNode
  testId?: string
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-testid={testId}
      className={`group inline-flex min-h-touch-target shrink-0 items-center rounded-full disabled:opacity-40 ${focusRing} ${className}`}
      {...props}
    >
      <span className={chipClass(selected)}>
        {Icon && <Icon className="size-icon-sm" />}
        {children}
        {trailing}
      </span>
    </button>
  )
}
