# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.restaurant(id)` on iOS, `Route.Restaurant(id)` on Android and `/restaurants/$restaurantId` on web.

## Signed out

Shown when there is no session (spec/features/auth.md). Signing in or creating an account replaces this stack with the main tabs; signing out replaces the main tabs with Welcome.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Welcome | `welcome` | `/welcome` | App start without a session; sign out |
| Sign in | `signIn` | `/sign-in` | Welcome; Sign up's switch link |
| Sign up | `signUp` | `/sign-up` | Welcome; Sign in's switch link |

## Signed in: tabs

One floating glass tab bar (DESIGN.md `TabBar`) switches between five tab roots. The tab bar is visible on tab roots only; every other screen is pushed above the tabs and hides it. Switching tabs keeps each tab's scroll position for the session.

| Tab | Screen | Route | Web path | Icon |
|---|---|---|---|---|
| Discover | Discover | `discover` | `/` | `tabDiscover` |
| Explore | Explore | `explore` | `/explore` (search params: `q`, `cuisine`, `collection`) | `tabExplore` |
| Reservations | Reservations | `reservations` | `/reservations` | `tabReservations` |
| Saved | Saved | `saved` | `/saved` | `tabSaved` |
| Profile | Profile | `profile` | `/profile` | `tabProfile` |

Opening Explore from Discover (search bar, hero CTA, cuisine chip, collection card) switches to the Explore tab with that query, cuisine or collection applied, replacing whatever filters Explore had.

## Signed in: pushed screens

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Restaurant | `restaurant(restaurantId)` | `/restaurants/$restaurantId` | Any restaurant card; Reservation detail |
| Reserve | `reserve(restaurantId, reservationId?)` | `/restaurants/$restaurantId/reserve` (search param `reservationId` when modifying) | Restaurant's Reserve; Modify; Book again |
| Confirmation | `confirmation(reservationId)` | `/reservations/$reservationId/confirmation` | Confirming or saving in Reserve (replaces Reserve, so Back from Confirmation returns to the screen before Reserve) |
| Reservation detail | `reservation(reservationId)` | `/reservations/$reservationId` | A reservation card; a notification |
| Notifications | `notifications` | `/notifications` | Discover's bell |
| Dining preferences | `preferences` | `/profile/preferences` | Profile |
| Help & support | `help` | `/help` | Profile |
| Settings | `settings` | `/settings` | Profile |

Profile's "Saved restaurants" row switches to the Saved tab and "Reservation history" switches to the Reservations tab with Past selected.

## Per platform

- **iOS:** `RootView` shows the signed-out `NavigationStack` (Welcome root) or the signed-in `NavigationStack` whose root is `TabsScreen` (the five tab roots plus the custom `TabBar`). Pushed screens are appended as `Route` values to the signed-in stack, above the tabs. The system navigation bar is hidden (`.toolbar(.hidden, for: .navigationBar)`) and screens draw `ScreenHeader` or `TopBar`; the interactive swipe-back gesture stays enabled.
- **Android:** one Navigation 3 back stack. Signed out it starts at `Route.Welcome`; signed in at `Route.Tabs` (hosting the five tab roots and the `TabBar`, with the selected tab saved in the entry's state). Pushed screens are added above `Route.Tabs`. System back pops; on a tab root other than Discover it first returns to Discover.
- **Web:** TanStack Router file routes. A `_tabs` layout route renders the five tab screens with the `TabBar`; pushed screens are sibling routes without it. Unauthenticated visits to any signed-in path redirect to `/welcome` (after hydration, since the session is in localStorage); signed-in visits to auth paths redirect to `/`.

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
