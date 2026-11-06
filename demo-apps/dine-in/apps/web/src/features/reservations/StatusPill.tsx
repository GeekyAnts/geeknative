import { strings } from '#/generated/strings'
import type { ReservationGroup } from './Reservation'

const label: Record<ReservationGroup, string> = {
  upcoming: strings.reservationsStatusConfirmed,
  past: strings.reservationsStatusCompleted,
  cancelled: strings.reservationsStatusCancelled,
}

const tone: Record<ReservationGroup, string> = {
  upcoming: 'bg-success text-on-success',
  past: 'bg-surface-variant text-on-surface-variant',
  cancelled: 'bg-error text-on-error',
}

/** Confirmed (success), completed (muted) or cancelled (error). */
export function StatusPill({ group, className = '' }: { group: ReservationGroup; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-md py-xxs text-caption shadow-low ${tone[group]} ${className}`}>{label[group]}</span>
}
