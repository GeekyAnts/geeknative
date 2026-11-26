import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Icon-only control with a token-sized touch target. */
export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex size-touch-target items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
