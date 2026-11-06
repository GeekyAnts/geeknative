import type { ReactNode } from 'react'

/**
 * A screen's content (DESIGN.md: Screen). The app shell is full width; each screen picks how
 * wide its content runs:
 * - `readable` (default): a centered column for forms, settings, lists and detail screens.
 * - `full`: the whole width, for cinematic photography, grids and side-by-side panes.
 */
export function Page({ width = 'readable', children, className = '' }: { width?: 'readable' | 'full'; children: ReactNode; className?: string }) {
  return (
    <div className={`flex w-full flex-col gap-xl ${width === 'readable' ? 'mx-auto max-w-2xl px-lg py-xl md:px-xl' : ''} ${className}`}>
      {children}
    </div>
  )
}
