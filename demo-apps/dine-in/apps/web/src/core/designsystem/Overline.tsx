import type { ReactNode } from 'react'

/** Spaced uppercase `overline` text in `accent` (or `onGlassOnImage` on photos). */
export function Overline({ children, onImage = false, className = '' }: { children: ReactNode; onImage?: boolean; className?: string }) {
  return (
    <p className={`text-overline uppercase tracking-(--spacing-tracking) ${onImage ? 'text-on-glass-on-image' : 'text-accent'} ${className}`}>
      {children}
    </p>
  )
}
