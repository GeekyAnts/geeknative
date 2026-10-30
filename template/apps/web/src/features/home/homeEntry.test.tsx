// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, test } from 'vitest'
import { InMemorySettingsRepository } from '#/features/settings/InMemorySettingsRepository'
import { strings } from '#/generated/strings'
import { routeTree } from '#/routeTree.gen'

describe('Home entry point', () => {
  test('AC-home-3: the Settings entry point opens Settings', async () => {
    const queryClient = new QueryClient()
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
      context: { queryClient, container: { settingsRepository: new InMemorySettingsRepository() } },
    })
    await router.load()
    const root = document.createElement('div')
    document.body.append(root)
    await act(async () => {
      createRoot(root).render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      )
    })

    const entry = document.querySelector<HTMLAnchorElement>('[data-testid="home.openSettings"]')
    expect(entry?.getAttribute('aria-label')).toBe(strings.homeOpenSettings)
    await act(async () => {
      entry?.click()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(router.state.location.pathname).toBe('/settings')
    expect(document.body.textContent).toContain(strings.settingsTitle)
  })
})
