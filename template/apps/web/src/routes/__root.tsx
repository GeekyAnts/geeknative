import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, ScriptOnce, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppContainer } from '#/core/AppContainer'
import { AppearanceEffect, appearanceScript } from '#/core/AppearanceEffect'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
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

function AppShell() {
  return (
    <>
      <AppearanceEffect />
      <header className="border-b border-outline">
        <nav className="mx-auto flex max-w-2xl items-center justify-between px-lg py-md">
          <Link to="/" className="text-title">
            {AppIdentity.name}
          </Link>
          <Link
            to="/settings"
            aria-label={strings.homeOpenSettings}
            data-testid="home.openSettings"
            className="rounded-full p-md text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
          >
            <AppIcons.settings aria-hidden className="size-icon-md" />
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-lg py-xl">
        <Outlet />
      </main>
    </>
  )
}
