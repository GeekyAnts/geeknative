# Decisions

A dated log of product and technical decisions, and of assumptions made along the way. Newest first.

## 2026-11-06: Home overlay chrome

- Home hides the system navigation bar. iOS 26+ Liquid Glass still paints a frosted bar over a full-bleed hero even when `toolbarBackground` is hidden, which dirties the photograph. Brand name and Settings sit on the image as overlay type instead. Android matches: no Material `TopAppBar` on Home.

## 2026-11-06: Luxury destination wedding concierge

- The product is ORLÈVE, a destination wedding concierge. Catalog content (destination names, venue copy, prices, photography URLs) is sample data in each app's `WeddingCatalog`, not localization strings. Chrome, filters, empty states and actions stay in contracts/strings.
- Brand colour is Caldera Navy (`primary` `#1F3A4D`) with champagne gold, so destination photography is not tinted rust.
- One typeface for all three apps (GeekNative). Playfair Display is used for headings and body, rather than pairing a serif with Inter, so the editorial voice stays consistent.
- Home is image-led. Featured destinations are large editorial photographs, not a dense card grid.
- Packages is a full screen on every platform. Web places it in the header; iOS and Android push it from Home, the Plan CTA, and the Wedding dashboard so the tab bar stays at five items.
- There is no backend. `CatalogRepository` is read-only sample data. `WeddingRepository` persists the couple's plan and enquiries locally (`wedding.plan`, `wedding.enquiries`).
- Venue maps open the system map from coordinates; no Maps SDK key.
- Android loads remote photography with Coil. iOS uses `AsyncImage`. Web uses `img`.
- Currency in sample data is US dollars, displayed with a grouped number and a leading `$` from catalog helpers — not as composed sentences.
- A missing or unknown wedding plan counts as the empty default in `WeddingPlan.empty`.

## 2026-11-06: Cross-platform consistency

Configured as **strict**: same features, screens and behavior on every platform, with native controls.

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
- There's no backend yet. Each feature reads and writes through a repository interface with local implementations.
- Dependencies are wired by hand in an `AppContainer` on every platform, with no DI framework.
