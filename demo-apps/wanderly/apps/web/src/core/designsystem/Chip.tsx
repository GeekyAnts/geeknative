import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Multi-choice chip; primary fill when selected. */
export function Chip({
  selected,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-touch-target items-center gap-sm rounded-full px-lg text-label focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition motion-safe:duration-fast motion-safe:ease-standard ${
        selected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
