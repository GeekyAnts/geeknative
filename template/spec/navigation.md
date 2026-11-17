# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.settings` on iOS, `Route.Settings` on Android and `/settings` on web.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Home | `home` | `/` | App start |
| Settings | `settings` | `/settings` | Home's Settings entry |

## Per platform

- **iOS:** one `NavigationStack` rooted at Home. Screens are pushed by appending a `Route` (apps/ios/App/Core/Navigation/Route.swift).
- **Android:** one Navigation 3 back stack starting at `Route.Home`. Screens are pushed with `backStack.add(...)` (apps/android/.../core/navigation).
- **Web:** TanStack Router file routes in apps/web/src/routes. One site header (`SiteHeader`): the app name always links to `/`. Primary destinations (not Home, not Settings) sit on the trailing edge of that header on a wide window. Below `md`, a leading hamburger opens the same list in a left drawer (`nav.menuToggle`, `nav.menu`, `nav.menuClose`). Settings is the gear on the trailing edge. Do not add a sidebar, a bottom bar, or a second copy of the same links. Every screen has a URL.

## Test IDs

- `nav.menuToggle` (web, only when there is a destination besides Home): leading hamburger that opens the compact left drawer
- `nav.menu` (web, only when there is a destination besides Home): the left drawer on compact viewports
- `nav.menuClose` (web, only when there is a destination besides Home): closes the left drawer

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
