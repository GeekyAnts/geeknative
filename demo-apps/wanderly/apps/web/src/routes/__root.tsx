import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, ScriptOnce, Scripts, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import type { AppContainer } from '#/core/AppContainer'
import { AppearanceEffect, appearanceScript } from '#/core/AppearanceEffect'
import { AppIdentity } from '#/generated/app'
import { defaultLocale, strings } from '#/generated/strings'
import appCss from '../styles.css?url'

export interface RouterContext {
  queryClient: QueryClient
  container: AppContainer
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: AppIdentity.name },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  shellComponent: RootDocument,
  component: AppShell,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        {/* Applies the stored appearance before the first paint, so there's no flash of the wrong theme. */}
        <ScriptOnce children={appearanceScript} />
        <HeadContent />
      </head>
      <body className="bg-background text-on-background antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

const tabs = [
  { to: '/', label: () => strings.tabsHome },
  { to: '/explore', label: () => strings.tabsExplore },
  { to: '/trips', label: () => strings.tabsTrips },
  { to: '/saved', label: () => strings.tabsSaved },
  { to: '/profile', label: () => strings.tabsProfile },
] as const

function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <>
      <AppearanceEffect />
      <header className="border-b border-outline">
        <nav className="flex flex-wrap items-center justify-between gap-md px-lg py-md md:px-xl">
          <Link to="/" data-testid="home.title" className="text-title focus-visible:outline-2 focus-visible:outline-primary">
            {AppIdentity.name}
          </Link>
          <div className="flex flex-wrap items-center gap-xs">
            {tabs.map((tab) => {
              const active = tab.to === '/' ? pathname === '/' : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
              const className = `inline-flex min-h-touch-target items-center px-md text-label focus-visible:outline-2 focus-visible:outline-primary ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`
              if (tab.to === '/explore') {
                return (
                  <Link key={tab.to} to="/explore" search={{ q: undefined, category: undefined }} className={className}>
                    {tab.label()}
                  </Link>
                )
              }
              return (
                <Link key={tab.to} to={tab.to} className={className}>
                  {tab.label()}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>
      {/* Full width, like the mobile apps: content runs edge to edge with the same side padding as the header. */}
      <main className="px-lg py-xl md:px-xl">
        <Outlet />
      </main>
    </>
  )
}
