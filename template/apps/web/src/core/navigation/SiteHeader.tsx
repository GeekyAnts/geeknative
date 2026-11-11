import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

const navLinkClass =
  'inline-flex min-h-touch-target items-center px-md text-label text-on-background/80 motion-safe:transition motion-safe:duration-fast hover:text-primary'

const drawerLinkClass =
  'inline-flex min-h-touch-target w-full items-center px-md text-title text-on-background motion-safe:transition motion-safe:duration-fast hover:text-primary'

const destinations = [
  { to: '/', label: strings.navHome },
  { to: '/settings', label: strings.homeOpenSettings },
] as const

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)

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
      <nav className="flex items-center justify-between px-lg py-md md:px-xl">
        <Link to="/" className="text-title">
          {AppIdentity.name}
        </Link>
        <div className="hidden items-center md:flex">
          {destinations.map((item) => (
            <Link key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            data-testid="nav.menuToggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? strings.navCloseMenu : strings.navOpenMenu}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex size-touch-target items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary md:hidden"
          >
            {open ? <AppIcons.close aria-hidden className="size-icon-md" /> : <AppIcons.menu aria-hidden className="size-icon-md" />}
          </button>
          <Link
            to="/settings"
            aria-label={strings.homeOpenSettings}
            data-testid="home.openSettings"
            className="inline-flex size-touch-target items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
          >
            <AppIcons.settings aria-hidden className="size-icon-md" />
          </Link>
        </div>
      </nav>
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
          className={`absolute inset-y-0 end-0 flex w-full max-w-xs flex-col gap-xs border-s border-outline bg-background px-lg py-xl shadow-high motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard ${open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}
        >
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
    </header>
  )
}
