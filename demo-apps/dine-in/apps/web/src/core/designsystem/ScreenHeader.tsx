import type { ReactNode } from 'react'
import { AppSerif } from './AppSerif'
import { GoldRule } from './GoldRule'
import { Overline } from './Overline'

/** In-content, leading-aligned screen title: optional overline, gold rule, serif `display` title, optional subtitle. */
export function ScreenHeader({
  overline,
  title,
  subtitle,
  trailing,
  className = '',
}: {
  overline?: string
  title: string
  subtitle?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <header className={`flex items-end justify-between gap-md motion-safe:animate-fade-up ${className}`}>
      <div className="flex flex-col gap-xs">
        {overline && <Overline>{overline}</Overline>}
        <GoldRule />
        <AppSerif role="display" as="h1" className="text-on-background">
          {title}
        </AppSerif>
        {subtitle && <div className="text-body text-on-surface-variant">{subtitle}</div>}
      </div>
      {trailing}
    </header>
  )
}
