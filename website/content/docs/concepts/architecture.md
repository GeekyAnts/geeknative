---
title: Architecture
description: The mirrored architecture every geeknative app follows, with the same names on iOS, Android and web.
---

Each app is idiomatic for its platform, but all three share one structure and one vocabulary. An agent that knows where something lives in one app knows where it lives in the other two.

## The same concepts, in each platform's idiom

| Concept | iOS | Android | Web |
|---|---|---|---|
| Screen | `struct NotesScreen: View` | `@Composable fun NotesScreen(...)` | `NotesScreen` component, rendered by `routes/notes.tsx` |
| State and actions | `@Observable final class NotesViewModel` | `NotesViewModel : ViewModel()` with `uiState: StateFlow<NotesUiState>` | `useNotesViewModel()` hook, using TanStack Query |
| Data | `protocol NotesRepository` | `interface NotesRepository` | `interface NotesRepository` |
| Dependencies | `AppContainer`, from `@Environment(AppContainer.self)` | `AppContainer`, from `LocalAppContainer.current` | `AppContainer`, from router context |
| Navigation | A case in the `Route` enum | An object in the `Route` sealed interface | A file in `routes/` |
| Copy | `Strings.notesEmptyTitle` | `stringResource(R.string.notes_empty_title)` | `strings.notesEmptyTitle` |
| Colors, spacing, radii, icon sizes, type | `AppColors.primary`, `AppSpacing.md`, `AppRadius.lg`, `AppIconSize.md`, `AppTypography.title` | `AppTheme.colors.primary`, `AppSpacing.md`, `AppRadius.lg`, `AppIconSize.md`, `AppTypography.title` | `bg-primary`, `p-md`, `rounded-lg`, `size-icon-md`, `text-title` |
| Icons | `Image(AppIcon.settings)` | `Icon(AppIcons.settings, ...)` | `<AppIcons.settings className="size-icon-md" />` |
| Test IDs | `.accessibilityIdentifier("notes.addButton")` | `Modifier.testTag("notes.addButton")` | `data-testid="notes.addButton"` |
| Tests | Swift Testing: `@Test("AC-notes-2: ...")` | JUnit: ``fun `AC-notes-2 ...`()`` | Vitest: `test('AC-notes-2: ...')` |

## The reference feature: Settings

The starter Settings screen (appearance and app version) is built the same way on every platform. New features copy its patterns.

| | iOS | Android | Web |
|---|---|---|---|
| Screen | `SettingsScreen.swift` | `SettingsScreen.kt` | `SettingsScreen.tsx` |
| State | `SettingsViewModel.swift` | `SettingsViewModel.kt` | `useSettingsViewModel.ts` |
| Data | `SettingsRepository.swift` (`UserDefaultsSettingsRepository`, `InMemorySettingsRepository`) | `SettingsRepository.kt` (`DataStoreSettingsRepository`, `InMemorySettingsRepository`) | `SettingsRepository.ts`, `LocalStorageSettingsRepository.ts` |
| Model | `Appearance.swift` | `Appearance.kt` | `Appearance.ts` |
| Tests | `AppTests/SettingsTests.swift` | `SettingsTest.kt` | `settings.test.ts` |

The stored data matches too: every app stores the appearance under the key `settings.appearance`, as `system`, `light` or `dark`.

## Dependencies: a hand-written AppContainer

Every app wires its dependencies by hand in an `AppContainer`, with no dependency injection framework.

- **iOS:** `AppContainer.live()` at launch, put in the SwiftUI environment. `AppContainer.preview()` uses in-memory repositories for previews and tests.
- **Android:** `AppContainer.live(context)` in the `Application` class, provided to composables through `LocalAppContainer`. ViewModels are created with `viewModel { SettingsViewModel(container.settingsRepository) }`. `AppContainer.preview()` is for previews and tests.
- **Web:** `createAppContainer()` in `router.tsx`, passed to every route through router context with the TanStack Query client.

The same idea appears in all three apps, and Gradle builds stay free of annotation processing.

## No backend yet

Features read and write through repository interfaces with local implementations: UserDefaults on iOS, DataStore on Android, localStorage on web. When a backend arrives, new repository implementations call it, and `AppContainer` swaps them in. Screens and view models don't change.

On the web, TanStack Start's server functions and API routes are only for web-only concerns (rendering, cookies, SEO). Logic the mobile apps need too goes through repositories, so a future backend can serve all three apps.

## Native, not identical

| Same on every platform | Native to each platform |
|---|---|
| Features, flows and data | Navigation chrome (navigation bar, top app bar, site header) |
| Copy | Controls: pickers, switches, radio lists, segmented controls |
| Colors, spacing, radii, icon sizes and type scale | Gestures, haptics and transitions |
| The typeface (Inter by default) | The font of navigation bars and system controls |
| Icons: the same Lucide drawing everywhere | Chrome icons like the iOS back chevron |
| Screen structure and content order | Sheets, dialogs and menus |
| Accessibility labels and test IDs | |
