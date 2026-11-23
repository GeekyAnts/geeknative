import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, ScriptOnce, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppContainer } from '#/core/AppContainer'
import { AppearanceEffect, appearanceScript } from '#/core/AppearanceEffect'
import { useCart } from '#/features/cart/useCart'
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

const headerButton =
  'relative grid size-12 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary'

function AppShell() {
  return (
    <>
      <AppearanceEffect />
      <header className="sticky top-0 z-20 border-b border-outline bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-md px-lg py-xs">
          <Link
            to="/"
            className="rounded-md text-title font-bold tracking-tight text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {AppIdentity.name}
          </Link>
          <div className="flex items-center gap-xs">
            <CartButton />
            <Link to="/settings" aria-label={strings.homeOpenSettings} data-testid="home.openSettings" className={headerButton}>
              <AppIcons.settings aria-hidden className="size-icon-md" />
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-lg py-xl">
        <Outlet />
      </main>
    </>
  )
}

/** The header's Cart button, with the item count once the cart isn't empty. */
function CartButton() {
  const { summary } = useCart()
  return (
    <Link to="/cart" aria-label={strings.homeOpenCart} data-testid="home.openCart" className={headerButton}>
      <AppIcons.cart aria-hidden className="size-icon-md" />
      {summary.itemCount > 0 && (
        <span
          key={summary.itemCount}
          data-testid="home.cartBadge"
          className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-xs text-caption font-bold text-on-primary ring-2 ring-background motion-safe:animate-pop-in"
        >
          {summary.itemCount}
        </span>
      )}
    </Link>
  )
}
