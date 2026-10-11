import type { ReactNode } from 'react'

/** A card for grouped content on a screen (DESIGN.md: Card). */
export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg bg-surface p-lg text-on-surface ${className}`}>{children}</section>
}
