<!-- geeknative:begin (managed by geeknative: replaced on upgrade. Add your own rules under "Project rules" at the end.) -->
# Android app (Kotlin + Jetpack Compose)

Read the root AGENTS.md first. This file covers how the Android app is built.

## Stack

- Kotlin and Jetpack Compose with Material 3, Android 7.0 (API 24) and later (Navigation 3's minimum). Compiles against API 37.
- Navigation 3, ViewModel with StateFlow, Kotlin coroutines, DataStore.
- Dependencies are wired by hand in `AppContainer`: no DI framework.
- Core library desugaring is on, so `java.time` (LocalDate, LocalTime, ...) works down to API 24.
- AGP 9 with built-in Kotlin. Gradle downloads JDK 21 for the build (gradle/gradle-daemon-jvm.properties).
- JUnit and kotlinx-coroutines-test for unit tests; Compose UI tests run on the JVM with Robolectric (`@RunWith(RobolectricTestRunner::class)`), so `make check-android` needs no emulator. Plain unit tests have no Android APIs: calling one (`org.json`, `android.util.Log`, ...) throws rather than returning a default, so test such code with Robolectric or use a JVM library such as kotlinx-serialization-json.

## Layout

```
apps/android/
  gradle/libs.versions.toml      All dependency versions
  app/build.gradle.kts           Reads app/identity.properties (generated) for the app ID and version, and sets the
                                 environment (development for debug, production for release; `-PappEnvironment=staging`)
  app/src/main/kotlin/app/
    App.kt, MainActivity.kt      Creates AppContainer; applies the theme and appearance
    core/                        AppContainer, navigation/ (Route, AppNavigation), designsystem/ (AppTheme, AppCard)
    features/<name>/             <Name>Screen.kt, <Name>ViewModel.kt, <Name>Repository.kt, models
    generated/                   From contracts/ by `make gen`. Never edit.
  app/src/main/res/              values/generated_*.xml, drawable/generated_* (icons) and font/generated_* are generated; everything else is yours
  app/src/test/kotlin/app/       Unit tests, named after acceptance criteria
```

The Kotlin package is always `app`. The app's identity is its application ID (from contracts/app.json), so renaming the app never moves code.

## Patterns

Same names and responsibilities as the iOS and web apps.

| Concept | Android |
|---|---|
| Screen | `@Composable fun NotesScreen(...)` in features/notes/, plus a stateless `NotesContent` for previews |
| State and actions | `NotesViewModel : ViewModel()` exposing `uiState: StateFlow<NotesUiState>` and action functions |
| Data | `interface NotesRepository`, plus implementations such as `DataStoreNotesRepository` and `InMemoryNotesRepository` |
| Dependencies | `AppContainer` from `LocalAppContainer.current`; ViewModels are created with `viewModel { NotesViewModel(container.notesRepository) }` |
| Navigation | Add a `Route` object and an `entry<Route.Notes>` in AppNavigation; push with `backStack.add(Route.Notes)` |
| Copy | `stringResource(R.string.notes_empty_title)` (generated from contracts/strings); plurals with `AppPlurals.notesCount(count)`, never `pluralStringResource` directly, so a `zero` form works as on iOS and web |
| Colors, spacing, radii, icon sizes, type | `AppTheme.colors.primary`, `AppSpacing.md`, `AppRadius.lg`, `AppIconSize.md`, `AppSize.touchTarget`, `AppTypography.title` (the typeface comes with it) |
| Motion and shadows | `animationSpec = AppMotion.snappy()`, `AppMotion.standard(AppMotion.fast)`; `Modifier.shadow(AppElevation.low, shape)`. Never raw durations, easings or elevations. Material components draw their own elevation, so set it to 0 when you apply a token shadow (for example `FloatingActionButtonDefaults.elevation(0.dp, 0.dp, 0.dp, 0.dp)`), or they draw two. Compose follows the system's animation scale, so "Remove animations" turns motion off. |
| Icons | `Icon(AppIcons.settings, contentDescription = ...)` (generated vector drawables; never `Icons.Filled.*`) |
| Config | `AppConfig.apiBaseUrl`, `AppEnvironment.current` (generated from contracts/config.json) |
| Secrets | `AppSecrets.mapsApiKey` (generated from .env, git-ignored; never commit values) |
| Test IDs | `Modifier.testTag("notes.addButton")` |

Follow features/settings as the reference implementation.

## Rules

- Never hardcode user-facing text, colors or spacing. Add them to contracts/ and run `make gen`.
- Prefer native Material 3 components and Android conventions: top app bars, the system back gesture, snackbars, bottom sheets. DESIGN.md says what must match the other platforms.
- Collect flows with `collectAsStateWithLifecycle()`. Keep screens stateless below the ViewModel so they can be previewed.
- Support font scaling, dark mode and TalkBack: icon-only buttons need a content description from strings.
- Name tests after acceptance criteria: ``fun `AC-notes-2 ...`()``.

## Commands

- `make check-android`: builds the app and runs the unit tests. Full log: .geeknative/logs/android.log.
- `make run-android`: installs and launches the app on a running emulator or connected device.
- Open apps/android in Android Studio to use previews and the layout inspector.
<!-- geeknative:end -->

## Project rules

<!-- Your Android-specific rules. They override the defaults above, and geeknative upgrades never touch them. -->
