# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.settings` on iOS, `Route.Settings` on Android and `/settings` on web.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Home | `home` | `/` | App start |
| Settings | `settings` | `/settings` | Home's Settings entry |

## Per platform

- **iOS:** one `NavigationStack` rooted at Home. Screens are pushed by appending a `Route` (apps/ios/App/Core/Navigation/Route.swift).
- **Android:** one Navigation 3 back stack starting at `Route.Home`. Screens are pushed with `backStack.add(...)` (apps/android/.../core/navigation).
- **Web:** TanStack Router file routes in apps/web/src/routes. Every screen has a URL.

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
