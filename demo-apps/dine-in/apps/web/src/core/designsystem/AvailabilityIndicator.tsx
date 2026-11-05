import type { TodayAvailability } from '#/features/catalog/DemoAvailability'
import { availabilityLabel } from '#/features/catalog/Labels'

const dotClass: Record<TodayAvailability, string> = {
  available: 'bg-success',
  full: 'bg-warning',
  closed: 'bg-error',
}

/** A coloured dot and caption for today's demo availability. */
export function AvailabilityIndicator({
  availability,
  onImage = false,
  className = '',
}: {
  availability: TodayAvailability
  onImage?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-xs text-caption ${onImage ? 'text-on-glass-on-image' : 'text-on-surface-variant'} ${className}`}>
      <span aria-hidden="true" className={`size-sm shrink-0 rounded-full ${dotClass[availability]}`} />
      {availabilityLabel(availability)}
    </span>
  )
}
