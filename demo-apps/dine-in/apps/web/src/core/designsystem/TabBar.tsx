import { Link, useLocation } from '@tanstack/react-router'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { IconComponent } from '#/features/catalog/Labels'
import { focusRing } from './Buttons'
import { glassClass } from './GlassSurface'

type TabPath = '/' | '/explore' | '/reservations' | '/saved' | '/profile'

export const tabPaths: readonly TabPath[] = ['/', '/explore', '/reservations', '/saved', '/profile']

const tabs = (): { to: TabPath; label: string; icon: IconComponent }[] => [
  { to: '/', label: strings.tabDiscover, icon: AppIcons.tabDiscover },
  { to: '/explore', label: strings.tabExplore, icon: AppIcons.tabExplore },
  { to: '/reservations', label: strings.tabReservations, icon: AppIcons.tabReservations },
  { to: '/saved', label: strings.tabSaved, icon: AppIcons.tabSaved },
  { to: '/profile', label: strings.tabProfile, icon: AppIcons.tabProfile },
]

/** The floating glass capsule with five tabs; the `espresso` pill slides to the active one with the snappy spring. */
export function TabBar() {
  const { pathname } = useLocation()
  const items = tabs()
  const active = Math.max(
    0,
    items.findIndex((tab) => tab.to === pathname),
  )

  return (
    <nav
      className={`fixed inset-x-lg bottom-floating z-40 mx-auto h-tab-bar max-w-120 rounded-full p-xs ${glassClass({ floating: true })}`}
    >
      <div className="relative flex h-full">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-1/5 rounded-full bg-espresso motion-safe:transition-transform motion-safe:duration-snappy motion-safe:ease-snappy"
          style={{ transform: `translateX(${active * 100}%)` }}
        />
        {items.map((tab, index) => {
          const Icon = tab.icon
          const selected = index === active
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={selected ? 'page' : undefined}
              className={`relative z-10 flex min-h-touch-target flex-1 flex-col items-center justify-center gap-xxs rounded-full text-caption motion-safe:transition-colors motion-safe:duration-snappy motion-safe:ease-snappy ${
                selected ? 'text-on-espresso' : 'text-on-surface-variant hover:text-on-surface'
              } ${focusRing}`}
            >
              <Icon className="size-icon-md" />
              <span className="max-w-full truncate px-xxs">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
