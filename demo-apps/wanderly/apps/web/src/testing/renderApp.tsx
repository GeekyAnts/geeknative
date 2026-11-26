import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { AppContainer } from '#/core/AppContainer'
import { JsonCatalogRepository } from '#/features/catalog/JsonCatalogRepository'
import { InMemoryProfileRepository } from '#/features/profile/InMemoryProfileRepository'
import { InMemorySavedRepository } from '#/features/saved/InMemorySavedRepository'
import { InMemorySettingsRepository } from '#/features/settings/InMemorySettingsRepository'
import { InMemoryTripRepository } from '#/features/tripPlanner/InMemoryTripRepository'
import { routeTree } from '#/routeTree.gen'

/**
 * The app's dependencies with in-memory implementations, for tests. Add each new repository
 * here, so every test that renders the app gets a complete container.
 */
export function testContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  return {
    settingsRepository: new InMemorySettingsRepository(),
    catalogRepository: new JsonCatalogRepository(),
    savedRepository: new InMemorySavedRepository(),
    tripRepository: new InMemoryTripRepository(),
    profileRepository: new InMemoryProfileRepository(),
    ...overrides,
  }
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
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
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

/** Sets a field value and waits for the app to settle. */
export async function change(element: Element | null, value: string) {
  await act(async () => {
    const field = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
    if (!field) return
    const proto =
      field instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : field instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
}

export async function wait(ms = 50) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

/** Submits a form and waits for the app to settle. */
export async function submit(element: Element | null) {
  await act(async () => {
    const form = element instanceof HTMLFormElement ? element : element?.closest('form')
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
}
