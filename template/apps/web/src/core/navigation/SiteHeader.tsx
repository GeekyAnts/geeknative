import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

const navLinkClass =
  'inline-flex min-h-touch-target items-center px-md text-label text-on-background/80 motion-safe:transition motion-safe:duration-fast hover:text-primary'

const drawerLinkClass =
  'inline-flex min-h-touch-target w-full items-center px-md text-title text-on-background motion-safe:transition motion-safe:duration-fast hover:text-primary'

const iconButtonClass =
  'inline-flex size-touch-target shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary'

/**
 * Primary destinations except Home and Settings.
 * Home is the app name (always `to="/"`). Settings is the gear.
 * List each destination once: the header row on a wide window, this same array in the left drawer below `md`.
 * Do not add a sidebar, a bottom bar, or a second copy of these links.
 */
const destinations: { to: string; label: string }[] = []

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)
  const hasDrawer = destinations.length > 0

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('overflow-hidden')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('overflow-hidden')
    }
  }, [open])

  return (
    <header className="border-b border-outline">
      <nav className="flex items-center gap-sm px-lg py-md md:px-xl">
        {hasDrawer ? (
          <button
            type="button"
            data-testid="nav.menuToggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={strings.navOpenMenu}
            onClick={() => setOpen(true)}
            className={`${iconButtonClass} md:hidden`}
          >
            <AppIcons.menu aria-hidden className="size-icon-md" />
          </button>
        ) : null}
        <Link to="/" className="text-title">
          {AppIdentity.name}
        </Link>
        <div className="ms-auto hidden items-center md:flex">
          {destinations.map((item) => (
            <Link key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link
          to="/settings"
          aria-label={strings.homeOpenSettings}
          data-testid="home.openSettings"
          className={`${iconButtonClass} max-md:ms-auto`}
        >
          <AppIcons.settings aria-hidden className="size-icon-md" />
        </Link>
      </nav>
      {hasDrawer ? (
        <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}>
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label={strings.navCloseMenu}
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-on-background/40 motion-safe:transition-opacity motion-safe:duration-fast ${open ? 'opacity-100' : 'opacity-0'}`}
          />
          <aside
            id="site-menu"
            data-testid="nav.menu"
            aria-hidden={!open}
            className={`absolute inset-y-0 start-0 flex w-full max-w-xs flex-col gap-xs border-e border-outline bg-background px-lg py-md shadow-high motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-title">{AppIdentity.name}</span>
              <button
                type="button"
                data-testid="nav.menuClose"
                aria-label={strings.navCloseMenu}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className={iconButtonClass}
              >
                <AppIcons.close aria-hidden className="size-icon-md" />
              </button>
            </div>
            {destinations.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={drawerLinkClass}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </aside>
        </div>
      ) : null}
    </header>
  )
}
