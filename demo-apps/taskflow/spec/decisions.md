# Decisions

A dated log of product and technical decisions, and of assumptions made along the way. Newest first.

## 2026-11-18: Taskflow, a task manager with a shared backend

- **Product.** The app is Taskflow (contracts/app.json `name`; the bundle and application ID stay `com.example.taskmanagementapp`). Three features replace the starter Home: Tasks (start screen), Task detail and Task editor. Settings stays and gains the server address.
- **Consistency is `strict`.** Every feature ships on all three platforms; `n/a` is not allowed.
- **Backend.** `backend/` is a Node.js + Express 5 server with SQLite through Node's built-in `node:sqlite` (no native modules to compile). It implements `contracts/api.json` exactly, serves it at `/openapi.json`, and seeds 14 realistic tasks with fixed ids on first start (`npm run seed --workspace backend` resets them). Due dates in the seed are relative to the day it runs, so there are always overdue, due-soon and done tasks.
- **API contract.** `contracts/api.json` (OpenAPI 3.1) is the source of truth. The model is `TaskItem`, not `Task`, because a generated Swift `struct Task` would shadow Swift concurrency's `Task`. Edits are a full `PUT` with `TaskInput` because the generated clients omit nil optionals when encoding, so a `PATCH` could never clear a due date. Quick status changes use `PATCH /tasks/{taskId}/status`. Filtering and sorting happen on the server, so every app shows the same list in the same order.
- **Generated clients only.** Every app's `ApiTasksRepository` calls the generated `ApiClient` (iOS, Android) or fetch helpers (web). No app has hand-written HTTP code. `InMemoryTasksRepository` with the same four sample tasks (spec/features/tasks.md) backs previews and tests, and the app itself when launched with `-uiTesting`.
- **apiBaseUrl.** Development is `http://127.0.0.1:8080` for all three apps. The iOS simulator and the browser reach the host directly; the Android emulator reaches it through `adb reverse tcp:8080 tcp:8080` (`make android-reverse`). Debug Android builds allow cleartext HTTP to `127.0.0.1` and `localhost` only (network security config). iOS needs no App Transport Security exception, because ATS doesn't apply to connections to IP addresses such as `127.0.0.1` (checked against the running backend). Staging and production URLs are placeholders until those servers exist.
- **Showcase capture** needs the seeded backend running (`make seed-backend && make run-backend`) and `make android-reverse`. The publish script builds web with `npm run build`, which defaults to production, so run it with `VITE_APP_ENVIRONMENT=development` to point the web app at 127.0.0.1:8080. iOS Debug and Android debug builds already use development.
- **Web navigation after a change:** saving or deleting replaces the current history entry, so Back never lands on the closed editor or a deleted task.
- **Due dates** are calendar dates (`YYYY-MM-DD`), parsed as local dates on every platform so they never shift a day across time zones.
- **Assumptions:** single user, no sign-in; no offline editing; no search in version one.

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

## 2026-11-18: Cross-platform consistency

Configured as **adapted**: same flows, data, copy and brand; n/a is allowed.
