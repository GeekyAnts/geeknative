import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createAppContainer } from './core/AppContainer'
import { tabPaths } from './core/designsystem/TabBar'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient, container: createAppContainer() },
    scrollRestoration: true,
    // Each tab keeps its scroll position for the session; other screens restore per history entry.
    getScrollRestorationKey: (location) =>
      (tabPaths as readonly string[]).includes(location.pathname) ? location.pathname : (location.state.__TSR_key ?? location.href),
    defaultPreload: 'intent',
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
