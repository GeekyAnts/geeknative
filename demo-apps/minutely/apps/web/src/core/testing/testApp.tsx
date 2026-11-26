import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import type { AppContainer } from '#/core/AppContainer'
import { InMemoryCartRepository } from '#/features/cart/InMemoryCartRepository'
import { LocalCatalogRepository } from '#/features/catalog/LocalCatalogRepository'
import { InMemoryOrdersRepository } from '#/features/order/InMemoryOrdersRepository'
import { InMemorySettingsRepository } from '#/features/settings/InMemorySettingsRepository'
import { routeTree } from '#/routeTree.gen'

/** The `placedAt` the test clock returns: its order id is MN123456 (spec/features/order.md). */
export const TEST_NOW = 1761800123456

/** An AppContainer with in-memory repositories and a fixed clock. Every member AppContainer has. */
export function testContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  return {
    settingsRepository: new InMemorySettingsRepository(),
    catalogRepository: new LocalCatalogRepository(),
    cartRepository: new InMemoryCartRepository(),
    ordersRepository: new InMemoryOrdersRepository(),
    clock: () => TEST_NOW,
    ...overrides,
  }
}

/** The app's real route tree in memory, starting at `entries[initialIndex]` (default: the last entry). */
export async function testRouter(entries: string[], container: AppContainer, initialIndex = entries.length - 1) {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: entries, initialIndex }),
    context: { queryClient, container },
  })
  await router.load()
  const app = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return { router, queryClient, app }
}

/** Waits for queries and navigation to settle. */
export async function settle(ms = 50) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

/** Renders the app into happy-dom (a test file using it starts with `// @vitest-environment happy-dom`). */
export async function renderApp(path: string | string[], container: AppContainer = testContainer(), initialIndex?: number) {
  const entries = Array.isArray(path) ? path : [path]
  const { router, queryClient, app } = await testRouter(entries, container, initialIndex)
  const root = document.createElement('div')
  document.body.append(root)
  const reactRoot = createRoot(root)
  await act(async () => {
    reactRoot.render(app)
  })
  await settle()

  const find = <T extends HTMLElement = HTMLElement>(testId: string) => root.querySelector<T>(`[data-testid="${testId}"]`)
  return {
    router,
    queryClient,
    container,
    root,
    find,
    /** All elements whose test ID starts with `prefix`, in document order. */
    findAll: (prefix: string) => [...root.querySelectorAll<HTMLElement>(`[data-testid^="${prefix}"]`)],
    click: async (testId: string) => {
      const element = find(testId)
      if (!element) throw new Error(`No element with data-testid="${testId}"`)
      await act(async () => {
        element.click()
      })
      await settle()
    },
    type: async (testId: string, value: string) => {
      const input = find<HTMLInputElement>(testId)
      if (!input) throw new Error(`No element with data-testid="${testId}"`)
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await settle()
    },
    unmount: () => {
      act(() => reactRoot.unmount())
      root.remove()
    },
  }
}

/** Renders the app on the "server" (no DOM needed), as the HTML the browser first receives. */
export async function renderAppToString(path: string, container: AppContainer = testContainer()) {
  const { app } = await testRouter([path], container)
  return renderToString(app)
}
