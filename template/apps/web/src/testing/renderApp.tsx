import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { AppContainer } from '#/core/AppContainer'
import { InMemorySettingsRepository } from '#/features/settings/InMemorySettingsRepository'
import { routeTree } from '#/routeTree.gen'

/**
 * The app's dependencies with in-memory implementations, for tests. Add each new repository
 * here, so every test that renders the app gets a complete container.
 */
export function testContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  return { settingsRepository: new InMemorySettingsRepository(), ...overrides }
}

/**
 * Renders the whole app at `path` into the test's DOM, with the real routes and the given
 * dependencies. Use it in tests that start with `// @vitest-environment happy-dom` and drive
 * the UI: covering a (ui) acceptance criterion means clicking through this, not calling a view model.
 */
export async function renderApp(path: string, container: AppContainer = testContainer()) {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient, container },
  })
  await router.load()
  const element = document.createElement('div')
  document.body.append(element)
  const root = createRoot(element)
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
  })
  return {
    element,
    router,
    unmount: () => {
      act(() => root.unmount())
      element.remove()
    },
  }
}

/** Clicks an element and waits for the app to settle (navigation, queries). */
export async function click(element: Element | null) {
  await act(async () => {
    ;(element as HTMLElement | null)?.click()
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
}
