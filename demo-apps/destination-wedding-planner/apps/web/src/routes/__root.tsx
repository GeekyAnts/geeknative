import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, ScriptOnce, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppContainer } from '#/core/AppContainer'
import { AppearanceEffect, appearanceScript } from '#/core/AppearanceEffect'
import { SiteHeader } from '#/core/navigation/SiteHeader'
import { AppIdentity } from '#/generated/app'
import { defaultLocale } from '#/generated/strings'
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
        <ScriptOnce children={appearanceScript} />
        <HeadContent />
      </head>
      <body className="overflow-x-hidden bg-background text-on-background antialiased">
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
      <SiteHeader />
      <main>
        <Outlet />
      </main>
    </>
  )
}
