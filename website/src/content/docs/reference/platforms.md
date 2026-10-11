---
title: Platforms
description: How each of the three apps is built, laid out, tested and run.
---

Each app has its own `AGENTS.md` with these conventions, for agents working in that folder.

## iOS

**Stack:** SwiftUI and Observation (`@Observable`), iOS 17 and later. Swift 6 language mode, with code isolated to the main actor by default: background work is marked `nonisolated` or `@concurrent` explicitly. Swift Testing for tests. No third-party dependencies.

**Project:** `apps/ios/App.xcodeproj` uses synchronized folders for `App/` and `AppTests/`, so new files are picked up without editing `project.pbxproj`. Build settings live in `Config/*.xcconfig`:

| File | Contents |
|---|---|
| `Base.xcconfig` | Shared settings: deployment target, Swift version, concurrency |
| `Debug.xcconfig`, `Release.xcconfig` | Per-configuration settings |
| `App.xcconfig` | The app target: Info.plist keys, app icon, accent color. Set `DEVELOPMENT_TEAM` here to run on a device. |
| `AppTests.xcconfig` | The unit test target |
| `Identity.xcconfig` | Generated from `contracts/app.json` |

**Patterns:** a screen is `struct NotesScreen: View`; it holds its `@Observable final class NotesViewModel` in `@State`; data goes through `protocol NotesRepository`; dependencies come from `@Environment(AppContainer.self)`. Navigation is one `NavigationStack` in `RootView`: add a case to `Route` and handle it in `navigationDestination`. Each screen has a `#Preview` using `AppContainer.preview()` or in-memory repositories.

**Appearance:** `RootView` applies the chosen appearance to the windows themselves, so sheets and alerts follow it too.

**Commands:** `make check-ios` (build and tests on a simulator), `make run-ios`, or `open apps/ios/App.xcodeproj`.

**Gotchas:** adding a Swift package changes the project file, so the agent asks you first.

## Android

**Stack:** Kotlin and Jetpack Compose with Material 3, Android 7.0 (API 24) and later, compiled against API 37. Navigation 3, ViewModel with StateFlow, coroutines and DataStore. AGP 9 with built-in Kotlin. JUnit and kotlinx-coroutines-test for unit tests.

**Build:** every dependency version is in `gradle/libs.versions.toml`. `app/build.gradle.kts` reads the application ID and version from `app/identity.properties`, generated from `contracts/app.json`. Gradle downloads JDK 21 for the build (`gradle/gradle-daemon-jvm.properties`), so any JDK 17 or later can start it.

**Package:** the Kotlin package is always `app`. The app's identity is its application ID, so renaming the app never moves code.

**Patterns:** a screen is `@Composable fun NotesScreen(...)`, with a stateless content composable below it for previews. `NotesViewModel : ViewModel()` exposes `uiState: StateFlow<NotesUiState>` and action functions. Data goes through `interface NotesRepository`. Composables get dependencies from `LocalAppContainer.current`, and ViewModels are created with `viewModel { NotesViewModel(container.notesRepository) }`. Navigation is one Navigation 3 back stack: add an object to `Route`, an `entry<Route.Notes>` in `AppNavigation`, and push with `backStack.add(Route.Notes)`. Flows are collected with `collectAsStateWithLifecycle()`.

**Appearance:** `MainActivity` themes the whole app from the stored appearance, waits for it to load before the first frame, and keeps the system bar icons readable.

**Commands:** `make check-android` (build and unit tests), `make run-android`, or open `apps/android` in Android Studio for previews.

## Web

**Stack:** React 19 on TanStack Start (server rendering), with TanStack Router file routes and TanStack Query. Tailwind CSS v4 with the generated tokens, and Lucide icons. Strict TypeScript, Vite and Vitest. Supports Safari 16.4, Chrome 111 and Firefox 128 or later (Tailwind v4's minimum).

**Layout:** `router.tsx` creates the router with `{ queryClient, container }` as context. Each URL is a thin file in `routes/` that renders a feature's screen; `routes/__root.tsx` is the HTML shell and the site header. Features live in `features/<name>/`.

**Patterns:** `NotesScreen` renders state from `useNotesViewModel()`, which reads data with TanStack Query and returns state and actions. Data goes through a `NotesRepository` interface. Dependencies come from router context: `useRouteContext({ from: '__root__' }).container`. Styling uses token classes (`bg-surface`, `p-lg`), not arbitrary values. For complex primitives (dialogs, menus, popovers), shadcn/ui fits: the tokens already map onto its CSS variables.

**Server rendering:** code that uses browser APIs (localStorage, window) also runs safely on the server. Server functions and API routes are only for web-only concerns. The stored appearance is applied by a small script before the first paint, so there's no flash of the wrong theme.

**Commands:** `make check-web` (type-check, unit tests and a production build) and `make run-web` (dev server at `http://localhost:3000`).
