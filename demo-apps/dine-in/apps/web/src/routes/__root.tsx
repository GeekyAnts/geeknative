import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Navigate, Outlet, ScriptOnce, Scripts, createRootRouteWithContext, useLocation } from '@tanstack/react-router'
import type { AppContainer } from '#/core/AppContainer'
import { AppearanceEffect, appearanceScript } from '#/core/AppearanceEffect'
import { useHydrated } from '#/core/useHydrated'
import { useSession } from '#/features/auth/useSession'
import { AppIdentity } from '#/generated/app'
import { defaultLocale } from '#/generated/strings'
import appCss from '../styles.css?url'

export interface RouterContext {
  queryClient: QueryClient
  container: AppContainer
}

declare module '@tanstack/history' {
  interface HistoryState {
    /** Explore focuses its search field (arriving from Discover's search bar). */
    focusSearch?: boolean
    /** Reserve starts from this reservation's party size and seating (Book again). */
    rebookFrom?: string
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: AppIdentity.name },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'preconnect', href: 'https://images.unsplash.com' },
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
      <body className="min-h-dvh bg-background text-on-background antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

const signedOutPaths = new Set(['/welcome', '/sign-in', '/sign-up'])

/**
 * Shows the signed-out stack or the signed-in app. The session lives in localStorage, so nothing
 * renders (just the `background` colour) until hydration has read it: neither stack flashes.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const session = useSession()
  const { pathname } = useLocation()
  if (!hydrated || session.isPending) return <div aria-hidden="true" className="min-h-dvh bg-background" />
  const signedIn = session.data != null
  const signedOutPath = signedOutPaths.has(pathname)
  if (!signedIn && !signedOutPath) return <Navigate to="/welcome" replace />
  if (signedIn && signedOutPath) return <Navigate to="/" replace />
  return children
}

function AppShell() {
  return (
    <>
      <AppearanceEffect />
      <AuthGate>
        <Outlet />
      </AuthGate>
    </>
  )
}
