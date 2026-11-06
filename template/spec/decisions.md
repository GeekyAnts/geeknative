# Decisions

A dated log of product and technical decisions, and of assumptions made along the way. Newest first.

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
