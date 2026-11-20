import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { primaryClass } from '#/core/designsystem/Buttons'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

const navLinkClass =
  'inline-flex min-h-touch-target items-center px-md text-label text-current/80 motion-safe:transition motion-safe:duration-fast hover:text-primary'

const drawerLinkClass =
  'inline-flex min-h-touch-target w-full items-center px-md text-title text-current motion-safe:transition motion-safe:duration-fast hover:text-primary'

const destinations = [
  { to: '/', label: strings.navHome },
  { to: '/destinations', label: strings.navDestinations },
  { to: '/venues', label: strings.navVenues },
  { to: '/experiences', label: strings.navExperiences },
  { to: '/packages', label: strings.navPackages },
  { to: '/wedding', label: strings.navWedding },
] as const

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const overHero = pathname === '/'
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

  const chrome = overHero
    ? 'border-b border-inverse/15 bg-on-inverse/55 text-inverse backdrop-blur-md'
    : 'border-b border-outline/80 bg-background/85 text-on-background backdrop-blur-md'
  const drawerChrome = overHero
    ? 'border-s border-inverse/15 bg-on-inverse/90 text-inverse'
    : 'border-s border-outline/80 bg-background text-on-background'

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 ${chrome}`}>
        <nav className="flex items-center justify-between gap-sm px-lg py-sm md:gap-md md:px-xl">
          <Link to="/" className="min-w-0 truncate text-title tracking-[0.12em]">
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
            <Link to="/wedding" className={`${primaryClass} max-md:hidden`}>
              {strings.navPlanCta}
            </Link>
            <button
              type="button"
              data-testid="nav.menuToggle"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? strings.navCloseMenu : strings.navOpenMenu}
              onClick={() => setOpen((current) => !current)}
              className={`inline-flex size-touch-target items-center justify-center rounded-full text-current focus-visible:outline-2 focus-visible:outline-tertiary md:hidden ${overHero ? 'hover:bg-inverse/10' : 'hover:bg-primary/10'}`}
            >
              {open ? <AppIcons.close aria-hidden className="size-icon-md" /> : <AppIcons.menu aria-hidden className="size-icon-md" />}
            </button>
            <Link
              to="/settings"
              aria-label={strings.homeOpenSettings}
              data-testid="home.openSettings"
              className={`inline-flex size-touch-target items-center justify-center rounded-full text-current focus-visible:outline-2 focus-visible:outline-tertiary ${overHero ? 'hover:bg-inverse/10' : 'hover:bg-primary/10'}`}
            >
              <AppIcons.settings aria-hidden className="size-icon-md" />
            </Link>
          </div>
        </nav>
      </header>
      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label={strings.navCloseMenu}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-on-inverse/50 motion-safe:transition-opacity motion-safe:duration-fast ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          id="site-menu"
          data-testid="nav.menu"
          aria-hidden={!open}
          className={`${drawerChrome} absolute inset-y-0 end-0 flex w-full max-w-xs flex-col gap-xs px-lg py-xl shadow-high backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard ${open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}
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
          <Link to="/wedding" className={`${primaryClass} mt-sm`} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            {strings.navPlanCta}
          </Link>
        </aside>
      </div>
      {overHero ? null : <div className="h-[4.25rem]" aria-hidden />}
    </>
  )
}
