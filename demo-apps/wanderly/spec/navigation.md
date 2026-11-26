# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.settings` on iOS, `Route.Settings` on Android and `/settings` on web.

Five tabs are the roots. Pushed screens share one stack per tab (iOS), hide the tab bar (Android), and keep the site header (web).

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Home | `home` | `/` | App start, Home tab |
| Explore | `explore` | `/explore` | Explore tab; Home category chip (`?category=`); Home search submit (`?q=`) |
| My Trips | `trips` | `/trips` | Trips tab |
| Saved | `saved` | `/saved` | Saved tab |
| Profile | `profile` | `/profile` | Profile tab |
| City details | `city` | `/city/$destinationId` | Home, Explore, Saved, Trip planner destination |
| Place details | `place` | `/place/$placeId` | City details, Home popular, Explore places, Saved, Itinerary item |
| Trip planner | `planner` | `/planner` | City Plan a Trip (`?destinationId=`), Profile, My Trips empty action, Place add-to-trip when no trip exists |
| Itinerary | `itinerary` | `/itinerary/$tripId` | After generate; My Trips row |
| Settings | `settings` | `/settings` | Profile |

Query parameters (web paths; mobile routes carry the same values):

- Explore: `q` (search text), `category` (`beaches` \| `mountains` \| `adventure` \| `history` \| `food`)
- Planner: `destinationId`

## Per platform

- **iOS:** `TabView` of five `NavigationStack`s (Home, Explore, Trips, Saved, Profile). Pushed screens append a `Route` on that tab's stack and hide the tab bar so bottom actions stay tappable (apps/ios/App/Core/Navigation/Route.swift).
- **Android:** Material 3 `NavigationBar` for the five roots. Pushed screens (`City`, `Place`, `Planner`, `Itinerary`, `Settings`) are added to the Navigation 3 back stack and hide the bar. `Route.Explore` may include `q` and `category`; `Route.Planner` may include `destinationId`.
- **Web:** TanStack Router file routes in apps/web/src/routes. The site header lists the five tabs. Every screen has a URL.

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
