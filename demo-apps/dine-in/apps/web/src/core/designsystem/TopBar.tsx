import type { ReactNode } from 'react'
import { useScrolledPast } from '#/core/motion'
import { useBack } from '#/core/useBack'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { AppSerif } from './AppSerif'
import { glassClass } from './GlassSurface'
import { GlassIconButton } from './GlassIconButton'

/**
 * The bar on pushed screens: a glass back button and optional trailing actions over the content.
 * Once the content scrolls under it (past `collapseAfter` px) it becomes `glassStrong` with a serif title.
 * `overlay` lets the content run underneath it (photos at the top of a screen).
 */
export function TopBar({
  title,
  trailing,
  overlay = false,
  onImage = false,
  collapseAfter = 8,
  fallback = '/',
  onBack,
}: {
  title?: string
  trailing?: ReactNode
  overlay?: boolean
  onImage?: boolean
  collapseAfter?: number
  fallback?: string
  onBack?: () => void
}) {
  const back = useBack(fallback)
  const collapsed = useScrolledPast(collapseAfter)
  const overImage = onImage && !collapsed

  return (
    <div
      className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-30 motion-safe:transition-colors motion-safe:duration-normal motion-safe:ease-standard ${
        collapsed ? `${glassClass({ strong: true })} border-x-0 border-t-0` : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex min-h-(--spacing-huge) max-w-6xl items-center gap-md px-lg py-sm">
        <GlassIconButton icon={AppIcons.back} label={strings.commonBack} onImage={overImage} onClick={onBack ?? back} />
        <div className="min-w-0 flex-1">
          {title && (
            <AppSerif
              role="title"
              as="p"
              aria-hidden={!collapsed}
              className={`truncate text-on-surface motion-safe:transition motion-safe:duration-normal motion-safe:ease-decelerate ${
                collapsed ? 'opacity-100 translate-y-0' : 'opacity-0 motion-safe:translate-y-xs'
              }`}
            >
              {title}
            </AppSerif>
          )}
        </div>
        {trailing && <div className="flex items-center gap-sm">{trailing}</div>}
      </div>
    </div>
  )
}
