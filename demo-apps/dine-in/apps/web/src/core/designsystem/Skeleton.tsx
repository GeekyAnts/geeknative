/** A `surfaceVariant` block with a slow shimmer; static with reduced motion (styles.css `.skeleton`). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-md ${className}`} />
}
