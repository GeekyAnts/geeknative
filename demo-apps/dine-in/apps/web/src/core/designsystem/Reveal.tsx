import type { ElementType, ReactNode } from 'react'
import { staggerDelay, useInView } from '#/core/motion'

/**
 * Fades in while sliding up by `spacing.xl` the first time it scrolls into view, staggered by
 * `index` (DESIGN.md: Motion). Static with reduced motion.
 */
export function Reveal({
  as: Tag = 'section',
  index = 0,
  className = '',
  children,
  ...props
}: { as?: ElementType; index?: number; className?: string; children: ReactNode } & Record<string, unknown>) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: staggerDelay(index) }}
      className={`motion-safe:transition motion-safe:duration-normal motion-safe:ease-decelerate ${
        inView ? 'opacity-100 translate-y-0' : 'motion-safe:translate-y-xl motion-safe:opacity-0'
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
