import type { ReactNode } from 'react'
import { glassClass } from './GlassSurface'

/**
 * A floating glass bar at the bottom holding a primary action and optional summary text. Slides up on
 * appear. `notice` (an error banner) shows above the action.
 */
export function StickyActionBar({ summary, notice, children }: { summary?: ReactNode; notice?: ReactNode; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-lg bottom-floating z-30 mx-auto max-w-3xl motion-safe:animate-rise">
      <div className={`pointer-events-auto flex flex-col gap-sm rounded-xl p-md ps-lg ${glassClass({ floating: true })}`}>
        {notice}
        <div className="flex items-center justify-between gap-md">
          {summary && <div className="min-w-0 flex-1">{summary}</div>}
          {children}
        </div>
      </div>
    </div>
  )
}
