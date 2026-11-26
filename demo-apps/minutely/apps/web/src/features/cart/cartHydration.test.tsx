// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import type { AppContainer } from '#/core/AppContainer'
import { settle, testContainer } from '#/core/testing/testApp'
import { HomeScreen } from '#/features/home/HomeScreen'
import type { CartLine } from './CartRepository'
import { InMemoryCartRepository } from './InMemoryCartRepository'
import { cartQuery } from './useCart'

interface Context {
  queryClient: QueryClient
  container: AppContainer
}

/** A router with just the Home screen (no HTML shell), so the test needs no browser or server. */
async function homeRouter(stored: CartLine[], { loadStoredFirst = false } = {}) {
  const queryClient = new QueryClient()
  const cartRepository = new InMemoryCartRepository(stored)
  const rootRoute = createRootRouteWithContext<Context>()()
  const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomeScreen })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient, container: testContainer({ cartRepository }) },
  })
  await router.load()
  // In a browser the stored cart can be ready before the page finishes hydrating.
  if (loadStoredFirst) await queryClient.prefetchQuery(cartQuery(cartRepository))
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('Cart, loaded from a server-rendered page', () => {
  test('AC-cart-2: the stored cart appears after hydration, without a hydration mismatch', async () => {
    // The server has no localStorage, so it renders an empty cart.
    const html = renderToString(await homeRouter([]))
    expect(html).not.toContain('data-testid="cartBar"')
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const recoverable: unknown[] = []
    const app = await homeRouter([{ productId: 'banana', quantity: 2 }], { loadStoredFirst: true })
    await act(async () => {
      hydrateRoot(root, app, { onRecoverableError: (error) => void recoverable.push(error) })
    })
    await settle()
    const hydrationErrors = errors.mock.calls.filter((call) => String(call[0]).toLowerCase().includes('hydrat'))
    errors.mockRestore()

    expect(recoverable).toEqual([])
    expect(hydrationErrors).toEqual([])
    expect(root.querySelector('[data-testid="product.banana.quantity"]')?.textContent).toBe('2')
    expect(root.querySelector('[data-testid="cartBar"]')).not.toBeNull()
    root.remove()
  })
})
