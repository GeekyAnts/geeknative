import type { HTMLAttributes, ReactNode } from 'react'

/** A card for grouped content on a screen (DESIGN.md: Card). */
export function AppCard({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`rounded-lg bg-surface p-lg text-on-surface ${className}`} {...props}>
      {children}
    </section>
  )
}
