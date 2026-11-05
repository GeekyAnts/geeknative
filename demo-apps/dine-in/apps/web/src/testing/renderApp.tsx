import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { AppContainer } from '#/core/AppContainer'
import type { StoredAccount } from '#/features/auth/Account'
import { InMemoryAuthRepository } from '#/features/auth/InMemoryAuthRepository'
import { InMemoryCatalogRepository } from '#/features/catalog/InMemoryCatalogRepository'
import { InMemoryExploreRepository } from '#/features/explore/InMemoryExploreRepository'
import { InMemoryPreferencesRepository } from '#/features/profile/InMemoryPreferencesRepository'
import { InMemoryReservationsRepository } from '#/features/reservations/InMemoryReservationsRepository'
import { InMemorySavedRepository } from '#/features/saved/InMemorySavedRepository'
import { InMemorySettingsRepository } from '#/features/settings/InMemorySettingsRepository'
import { routeTree } from '#/routeTree.gen'

/** The fixed clock of every test: Wednesday 18 November 2026, 10:00 local time. */
export const TEST_NOW = new Date(2026, 10, 18, 10, 0, 0)

/** The member who is signed in by default. */
export const TEST_MEMBER: StoredAccount = {
  name: 'Aanya Kapoor',
  email: 'aanya@example.com',
  createdAt: '2025-03-14T09:30:00.000Z',
  passwordHash: 'test',
}

/** An auth repository with `TEST_MEMBER` signed in (or signed out). */
export const testAuth = ({ signedIn = true }: { signedIn?: boolean } = {}) =>
  new InMemoryAuthRepository({ accounts: [TEST_MEMBER], signedIn: signedIn ? TEST_MEMBER.email : undefined, now: () => TEST_NOW })

/**
 * The app's dependencies with in-memory implementations, for tests: `TEST_MEMBER` signed in and the
 * clock fixed at `TEST_NOW`. Add each new repository here, so every test that renders the app gets a
 * complete container.
 */
export function testContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  const now = overrides.now ?? (() => TEST_NOW)
  let ids = 0
  return {
    now,
    settingsRepository: new InMemorySettingsRepository(),
    catalogRepository: new InMemoryCatalogRepository(),
    authRepository: testAuth(),
    reservationsRepository: new InMemoryReservationsRepository([], {
      now,
      uuid: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`,
    }),
    savedRepository: new InMemorySavedRepository(),
    preferencesRepository: new InMemoryPreferencesRepository(),
    exploreRepository: new InMemoryExploreRepository(),
    ...overrides,
  }
}

/**
 * Renders the whole app at `path` into the test's DOM, with the real routes and the given
 * dependencies. Use it in tests that start with `// @vitest-environment happy-dom` and drive
 * the UI: covering a (ui) acceptance criterion means clicking through this, not calling a view model.
 */
export async function renderApp(path: string, container: AppContainer = testContainer()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
  await settle()
  return {
    element,
    router,
    queryClient,
    unmount: () => {
      act(() => root.unmount())
      element.remove()
    },
  }
}

/** Waits for the app to settle (navigation, queries, effects). */
export async function settle() {
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
  }
}

/** Clicks an element and waits for the app to settle (navigation, queries). */
export async function click(element: Element | null) {
  if (!element) throw new Error('click: element not found')
  await act(async () => {
    ;(element as HTMLElement).click()
  })
  await settle()
}

/** Types into an input or textarea the way React sees it, then waits for the app to settle. */
export async function type(element: Element | null, value: string) {
  if (!element) throw new Error('type: element not found')
  const input = element as HTMLInputElement | HTMLTextAreaElement
  const prototype = Object.getPrototypeOf(input) as object
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
}

/** The element with a test ID, inside `root`. */
export const byTestId = (root: ParentNode, id: string) => root.querySelector<HTMLElement>(`[data-testid="${CSS.escape(id)}"]`)
