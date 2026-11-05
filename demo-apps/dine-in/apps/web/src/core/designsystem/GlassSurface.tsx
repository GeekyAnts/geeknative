import type { ElementType, HTMLAttributes, ReactNode } from 'react'

/** Class names of a glass surface: translucent, blurred, hairline border, and lifted when it floats. */
export function glassClass({ floating = false, strong = false } = {}) {
  return `${strong ? 'bg-glass-strong' : 'bg-glass'} backdrop-blur-xl border border-glass-border ${floating ? 'shadow-high' : ''}`
}

/** Frosted warm-white surface for things that float (DESIGN.md: GlassSurface). */
export function GlassSurface({
  as: Tag = 'div',
  floating = false,
  strong = false,
  className = '',
  children,
  ...props
}: { as?: ElementType; floating?: boolean; strong?: boolean; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`${glassClass({ floating, strong })} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
