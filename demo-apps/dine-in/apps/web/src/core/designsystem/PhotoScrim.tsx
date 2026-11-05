/** Warm gradient from transparent to `scrim` over the lower 60% of a photo (or all of it), so text on it stays legible. */
export function PhotoScrim({ full = false, className = '' }: { full?: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${
        full ? 'inset-0 bg-linear-to-b from-scrim/55 via-transparent to-scrim' : 'h-3/5 bg-linear-to-b from-transparent to-scrim'
      } ${className}`}
    />
  )
}
