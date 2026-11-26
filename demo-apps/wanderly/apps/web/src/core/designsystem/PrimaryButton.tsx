import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-touch-target w-full items-center justify-center rounded-lg bg-primary px-lg text-label text-on-primary shadow-high focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
