// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import type { AppContainer } from '#/core/AppContainer'
import type { Appearance } from './Appearance'
import { InMemorySettingsRepository } from './InMemorySettingsRepository'
import { SettingsScreen } from './SettingsScreen'
import { appearanceQuery } from './useSettingsViewModel'

interface Context {
  queryClient: QueryClient
  container: AppContainer
}

/** A router with just the Settings screen, so the test needs no browser or server. */
async function settingsRouter(stored: Appearance, { loadStoredFirst = false } = {}) {
  const queryClient = new QueryClient()
  const settingsRepository = new InMemorySettingsRepository(stored)
  const rootRoute = createRootRouteWithContext<Context>()()
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsScreen })
  const router = createRouter({
    routeTree: rootRoute.addChildren([settingsRoute]),
    history: createMemoryHistory({ initialEntries: ['/settings'] }),
    context: { queryClient, container: { settingsRepository } },
  })
  await router.load()
  // In a browser the stored value can be ready before the page finishes hydrating.
  if (loadStoredFirst) await queryClient.prefetchQuery(appearanceQuery(settingsRepository))
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const checkedChoices = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLInputElement>('input[type=radio]')].filter((radio) => radio.checked).map((radio) => radio.value)

describe('Settings, loaded from a server-rendered page', () => {
  test('AC-settings-3: after a restart, the stored appearance is the selected choice', async () => {
    // The server has no storage, so it renders the default.
    const html = renderToString(await settingsRouter('system'))
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    expect(checkedChoices(root)).toEqual(['system'])

    // The browser then hydrates that page with Dark stored.
    await act(async () => {
      hydrateRoot(root, await settingsRouter('dark', { loadStoredFirst: true }))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(checkedChoices(root)).toEqual(['dark'])
    root.remove()
  })
})
