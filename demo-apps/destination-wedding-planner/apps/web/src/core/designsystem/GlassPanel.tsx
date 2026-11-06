import type { ReactNode } from 'react'

/** Frosted panel over photography or ivory (DESIGN.md: Glass panel). */
export function GlassPanel({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <div
      data-testid={testId}
      className={`rounded-xl border border-outline/80 bg-surface/80 shadow-high backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}
