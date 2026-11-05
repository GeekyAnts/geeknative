import type { InputHTMLAttributes } from 'react'

/** A checkbox with the switch role, tinted `espresso` when on. */
export function Switch({ testId, className = '', ...props }: { testId?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-testid={testId}
      className={`relative h-xxl w-(--spacing-huge) shrink-0 cursor-pointer appearance-none rounded-full bg-outline motion-safe:transition-colors motion-safe:duration-snappy motion-safe:ease-snappy checked:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary before:absolute before:start-xs before:top-xs before:size-xl before:rounded-full before:bg-surface before:shadow-low before:motion-safe:transition-transform before:motion-safe:duration-snappy before:motion-safe:ease-snappy checked:before:translate-x-xxl ${className}`}
      {...props}
    />
  )
}
