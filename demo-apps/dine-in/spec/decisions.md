# Decisions

A dated log of product and technical decisions, and of assumptions made along the way. Newest first.

## 2026-11-04: The Dining Club

The starter became The Dining Club, a luxury dining and table-reservation concierge (PRODUCT.md).

- **App name** is "The Dining Club" (contracts/app.json); the application ID stays `com.example.dinein`.
- **Custom chrome on every platform.** The brand needs serif in-content titles, a floating glass tab bar and glass buttons over photography, so all three apps hide the system navigation bar and tab bar and draw `ScreenHeader`, `TopBar` and `TabBar` (DESIGN.md). Push/pop transitions, the back gesture, sheets, dialogs, text input, the share sheet and the calendar screen stay native. Because of this, `common.back` is now used on every platform.
- **Two typefaces.** geeknative supports one shared family, which is Manrope (sans, `make font`). The serif display face, Cormorant Garamond (SIL OFL), lives in contracts/fonts/display and is copied into each app by `make assets`; each app's `AppSerif` helper uses it with the sizes of the typography tokens. Run `make assets` after changing those files; `make check-assets` fails if a copy is stale.
- **Demonstration catalog.** contracts/catalog.json holds 10 fictional Mumbai restaurants (with Unsplash photography, each image used once across the app) and is copied into each app by `make assets`. Catalog content is data, not UI copy, so it isn't in contracts/strings. A backend later replaces `BundledCatalogRepository` only.
- **Demonstration availability.** Slots come from a deterministic FNV-1a rule (spec/features/catalog.md), identical on every platform, and every screen that shows availability says it is demonstration data. No availability is presented as live.
- **Local data, per member.** No backend yet: accounts (`auth.accounts`, SHA-256 password hashes), the session (`auth.session`), reservations (`reservations.<email>`), saved restaurants (`saved.<email>`) and preferences (`preferences.<email>`) are stored on the device through repository interfaces with local implementations (UserDefaults, DataStore, localStorage).
- **Duplicate prevention.** Reservation writes are serialized, and saving rejects a second upcoming reservation at the same date and time or at the same restaurant on the same day (spec/features/reservation.md).
- **Formatting from strings.** Dates, times and prices are built from contracts/strings (`format.*`, `date.*`) rather than platform locale formatters, so all three apps print identical text ("Fri, 20 Nov", "7:30 PM", "₹2,400").
- **Images.** iOS uses `AsyncImage` with a shared `URLCache`; Android adds Coil 3 (`coil-compose`, `coil-network-okhttp`) and the `INTERNET` permission; web uses `<img loading="lazy">`. Maps are a single OpenStreetMap tile with attribution (spec/features/restaurant.md).
- **Android backdrop blur** uses the Haze library on API 31+ and falls back to the opaque `glassStrong` colour below that.
- **Home** (the starter screen) is replaced by Discover; spec/features/home.md and its code and tests are removed. Settings moves under Profile.

## 2026-11-04: Cross-platform consistency target

Configured as **strict** (Strict (95%-100%): 1:1 mirroring across all screens, identical layouts, minimal platform deviation.).

## 2026-10-30: Cross-platform consistency audit

Intentional differences between the apps, found while auditing them against each other:

- iOS Settings was a `Form` on the system grouped background, which in dark mode is pure black, not the app's `background` token. It now hides that background and uses `background` for the page and `surface` for the rows, like the other two apps. The form keeps its native layout (DESIGN.md, Components). The section titles still use the system gray, not `onSurfaceVariant`.
- On Android, Material's `surface` role is mapped to the `background` token, so `Scaffold` and `TopAppBar` use `background` while cards use `surface` (DESIGN.md, Components).
- `common.back` is used on Android only, for the explicit back button. iOS and web get back from the system and the site header (spec/features/settings.md).
- The web browser tab title is built in a route's `head` as `<screen title> · <app name>`. It is web chrome, so its separator is exempt from the no-literal-text rule (apps/web/AGENTS.md).
- Web touch targets are 48 px (the header gear and the appearance rows), above the 24 px WCAG minimum and matching Android's 48 dp.
- Android and web test the Home screen as rendered, including AC-home-3 (Home opens Settings): Android with Compose UI tests on Robolectric, web by rendering into happy-dom. All are test-only dependencies and don't ship in the apps. iOS covers AC-home-3 with an XCUITest in apps/ios/AppUITests, because SwiftUI exposes no accessibility tree to unit tests (spec/features/home.md).
- The `home` icon is defined in contracts/icons.json for all three platforms and used by none. It stays as a ready-made icon for new features.

Hand checks of the Settings behavior (spec/features/settings.md), run on 2026-10-30 on the iOS simulator, an Android emulator and headless Chrome. Not run means not checked yet, not failed.

| Check | iOS | Android | Web |
|---|---|---|---|
| With System chosen, the app follows a device appearance change while it is open | Pass | Pass | Pass |
| With Dark chosen and the device in light mode, a cold start has no flash of the light theme | Not run | Pass on Android 12 and later, splash screen included: the app registers the chosen appearance with the system (`UiModeManager.setApplicationNightMode`). Earlier versions have no API for it, so their splash follows the system. | Pass: the dark class is set when the document finishes parsing |
| Choosing Dark applies to the whole screen at once, including system bars | Not run | Pass | Pass |
| Back from Settings returns to Home with its state intact | Not run | Pass | Pass: browser back and the header home link both return to Home |
| After a restart with Dark stored, the Settings screen shows Dark as selected | Pass | Pass | Pass, after a fix (see below) |

Sheets and dialogs were not checked, because the starter has none.

Found by that check: on web, opening `/settings` directly with Dark stored showed a dark page but System as the selected choice. The server renders without localStorage, so the first client render disagreed with the server's HTML and React left the server's checked radio in place. The Settings view model now renders "system" until hydration is done, then the stored value. iOS and Android were not affected.

## 2026-10-10: Starter app

- The starter app has two screens, Home and Settings, implemented the same way on all three platforms as a reference for new features.
- The appearance setting is stored locally under `settings.appearance` as `system`, `light` or `dark`, on every platform.
- There's no backend yet. Each feature reads and writes through a repository interface with a local implementation.
- Dependencies are wired by hand in an `AppContainer` on every platform, with no DI framework.
