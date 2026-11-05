import { Link, type LinkProps } from '@tanstack/react-router'
import { strings } from '#/generated/strings'
import { AppSerif } from './AppSerif'
import { GoldRule } from './GoldRule'
import { Overline } from './Overline'

/** An `Overline`, gold rule and serif `title`, with an optional trailing "See all" link. */
export function SectionHeader({
  overline,
  title,
  seeAll,
  className = '',
  id,
}: {
  overline?: string
  title: string
  seeAll?: LinkProps
  className?: string
  id?: string
}) {
  return (
    <div className={`flex items-end justify-between gap-md ${className}`}>
      <div className="flex flex-col gap-xs">
        {overline && <Overline>{overline}</Overline>}
        <GoldRule />
        <AppSerif role="title" as="h2" id={id} className="text-on-background">
          {title}
        </AppSerif>
      </div>
      {seeAll && (
        <Link
          {...seeAll}
          className="inline-flex min-h-touch-target shrink-0 items-center text-label text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {strings.commonSeeAll}
        </Link>
      )}
    </div>
  )
}
