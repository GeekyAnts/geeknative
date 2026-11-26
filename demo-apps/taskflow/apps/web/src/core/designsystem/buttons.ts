const base =
  'inline-flex min-h-touch-target items-center justify-center gap-sm rounded-lg px-lg text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60'

/** A primary action: `onPrimary` on `primary` (DESIGN.md: Primary action). For a <button> or a <Link>. */
export const primaryButton = `${base} bg-primary text-on-primary hover:opacity-90`

/** A secondary action on a card or the page. */
export const secondaryButton = `${base} border border-outline text-on-background hover:bg-surface-variant`

/** A destructive action, in `error`. */
export const destructiveButton = `${base} border border-outline text-error hover:bg-surface-variant`

/** The confirming action of a destructive confirmation: `onError` on `error`. */
export const destructiveFilledButton = `${base} bg-error text-on-error hover:opacity-90`
