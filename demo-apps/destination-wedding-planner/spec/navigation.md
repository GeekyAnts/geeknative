# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.settings` on iOS, `Route.Settings` on Android and `/settings` on web.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Home | `home` | `/` | App start, Home tab |
| Destinations | `destinations` | `/destinations` | Tab, Home Explore Destinations, Home search |
| Destination detail | `destination` | `/destinations/$id` | Destinations, Home featured card |
| Venues | `venues` | `/venues` | Tab, Destination detail |
| Venue detail | `venue` | `/venues/$id` | Venues, Destination detail |
| Experiences | `experiences` | `/experiences` | Tab, Home teaser |
| Packages | `packages` | `/packages` | Header (web), Home, Plan Your Wedding, Wedding dashboard |
| Wedding | `wedding` | `/wedding` | Tab, Plan Your Wedding |
| Settings | `settings` | `/settings` | Settings entry on Home (and the site header on web) |

Query parameters on Destinations (all optional, same names on every platform when the platform has a URL): `location`, `date`, `guests`, `budget`, `style`.

## Per platform

- **iOS:** a `TabView` with five tabs (Home, Destinations, Venues, Experiences, Wedding). Each tab has its own `NavigationStack`. Packages, destination detail, venue detail and Settings are pushed. Screens are pushed by appending a `Route` (apps/ios/App/Core/Navigation/Route.swift).
- **Android:** a `Scaffold` with a navigation bar of the same five destinations and a Navigation 3 back stack. Packages and details are pushed with `backStack.add(...)`.
- **Web:** TanStack Router file routes in apps/web/src/routes. A floating glass header holds every primary destination plus Plan Your Wedding. Below the large breakpoint the destinations fold into a panel that drops from the header (`nav.menuToggle`, `nav.menu`). Every screen has a URL.

## Test IDs

- `nav.menuToggle`: opens and closes the compact web navigation panel
- `nav.menu`: the dropped navigation panel on compact viewports

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
