# Decisions

A dated log of product and technical decisions, and of assumptions made along the way. Newest first.

## 2026-10-30: Cross-platform consistency audit

Intentional differences between the apps, found while auditing them against each other:

- iOS Settings is a `Form` on the system grouped background, not the `background` or `surface` tokens (DESIGN.md, Components). In dark mode that background is pure black, darker than the `background` token the other two apps use.
- On Android, Material's `surface` role is mapped to the `background` token, so `Scaffold` and `TopAppBar` use `background` while cards use `surface` (DESIGN.md, Components).
- `common.back` is used on Android only, for the explicit back button. iOS and web get back from the system and the site header (spec/features/settings.md).
- The web browser tab title is built in a route's `head` as `<screen title> · <app name>`. It is web chrome, so its separator is exempt from the no-literal-text rule (apps/web/AGENTS.md).
- Web touch targets are 48 px (the header gear and the appearance rows), above the 24 px WCAG minimum and matching Android's 48 dp.
- AC-home-3 (Home opens Settings) is checked by hand, because the starter has no UI test harness (spec/features/home.md). `make parity` keeps showing it as untested.
- The `home` icon is defined in contracts/icons.json for all three platforms and used by none. It stays as a ready-made icon for new features.

Hand checks of the Settings behavior (spec/features/settings.md), run on 2026-10-30 on the iOS simulator, an Android emulator and headless Chrome. Not run means not checked yet, not failed.

| Check | iOS | Android | Web |
|---|---|---|---|
| With System chosen, the app follows a device appearance change while it is open | Pass | Pass | Pass |
| With Dark chosen and the device in light mode, a cold start has no flash of the light theme | Not run | Pass: every frame captured was dark, but capture started shortly after launch | Pass: the dark class is set when the document finishes parsing |
| Choosing Dark applies to the whole screen at once, including system bars | Not run | Pass | Not run |
| Back from Settings returns to Home with its state intact | Not run | Pass | Not run |

Sheets and dialogs were not checked, because the starter has none.

## 2026-10-10: Starter app

- The starter app has two screens, Home and Settings, implemented the same way on all three platforms as a reference for new features.
- The appearance setting is stored locally under `settings.appearance` as `system`, `light` or `dark`, on every platform.
- There's no backend yet. Each feature reads and writes through a repository interface with a local implementation.
- Dependencies are wired by hand in an `AppContainer` on every platform, with no DI framework.
