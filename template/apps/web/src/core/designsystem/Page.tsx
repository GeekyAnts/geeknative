import type { ReactNode } from 'react'

/**
 * A screen's content (DESIGN.md: Screen). The app shell is full width; each screen picks how
 * wide its content runs:
 * - `readable` (default): a centered column for forms, settings, lists and detail screens, so
 *   text and fields stay a comfortable width on wide windows.
 * - `full`: the whole width, for content that uses it (grids, boards, side-by-side panes).
 */
export function Page({ width = 'readable', children }: { width?: 'readable' | 'full'; children: ReactNode }) {
  return <div className={`flex w-full flex-col gap-xl ${width === 'readable' ? 'mx-auto max-w-2xl' : ''}`}>{children}</div>
}
