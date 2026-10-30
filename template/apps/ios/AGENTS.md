<!-- geeknative:begin (managed by geeknative: replaced on upgrade. Add your own rules under "Project rules" at the end.) -->
# iOS app (SwiftUI)

Read the root AGENTS.md first. This file covers how the iOS app is built.

## Stack

- SwiftUI and Observation (`@Observable`), iOS 17 and later (Observation's minimum).
- Swift 6 language mode. Code is main-actor isolated by default; mark background work `nonisolated` or `@concurrent` explicitly.
- Swift Testing (`import Testing`) for tests.
- No third-party dependencies unless the user asks for one.

## Layout

```
apps/ios/
  App.xcodeproj         Rarely edited. App/ and AppTests/ are synchronized folders:
                        new files are picked up automatically. Never add files to project.pbxproj.
  Config/               Build settings as .xcconfig files. Identity.xcconfig is generated.
  App/
    AppMain.swift       @main: creates AppContainer and shows RootView
    Core/               AppContainer, RootView, Navigation/Route.swift, DesignSystem/
    Features/<Name>/    <Name>Screen.swift, <Name>ViewModel.swift, <Name>Repository.swift, models
    Generated/          From contracts/ by `make gen`. Never edit.
    Resources/          Assets.xcassets (app icon)
  AppTests/             Swift Testing tests, named after acceptance criteria
```

## Patterns

Same names and responsibilities as the Android and web apps.

| Concept | iOS |
|---|---|
| Screen | `struct NotesScreen: View` in Features/Notes/ |
| State and actions | `@Observable final class NotesViewModel`, held in `@State` by its screen |
| Data | `protocol NotesRepository`, plus implementations such as `UserDefaultsNotesRepository` and `InMemoryNotesRepository` |
| Dependencies | `AppContainer`, read with `@Environment(AppContainer.self)`; `.live()` for the app, `.preview()` for previews and tests |
| Navigation | Add a case to `Route` and handle it in RootView's `navigationDestination` |
| Copy | `Strings.notesEmptyTitle` (generated) |
| Colors, spacing, radii, icon sizes, type | `AppColors.primary`, `AppSpacing.md`, `AppRadius.lg`, `AppIconSize.md`, `AppTypography.title` (generated; the typeface comes with it) |
| Icons | `Image(AppIcon.settings)` (generated template images in Icons.xcassets; color with `.foregroundStyle`) |
| Config | `AppConfig.apiBaseUrl`, `AppEnvironment.current` (generated from contracts/config.json) |
| Secrets | `AppSecrets.mapsApiKey` (generated from .env, git-ignored; never commit values) |
| Test IDs | `.accessibilityIdentifier("notes.addButton")` |

Follow Features/Settings as the reference implementation.

## Rules

- Never hardcode user-facing text, colors or spacing. Add them to contracts/ and run `make gen`.
- Prefer native components and behavior: `NavigationStack`, `Form`, `List`, toolbar items, sheets and swipe actions. Icons and the typeface come from the contracts (`AppIcon`, `AppTypography`), not from SF Symbols or `.system` fonts, so they match the other platforms. DESIGN.md says what else must match.
- Support Dynamic Type, dark mode and VoiceOver: icon-only buttons need an accessibility label from Strings.
- Give each screen a `#Preview` that uses `AppContainer.preview()` or in-memory repositories.
- Name tests after acceptance criteria: `@Test("AC-notes-2: ...")`.

## Commands

- `make check-ios`: builds the app and runs the tests on a simulator. Full log: .geeknative/logs/ios.log.
- `make run-ios`: builds, installs and launches the app on a simulator.
- `open apps/ios/App.xcodeproj` opens it in Xcode.

## Gotchas

- Don't edit project.pbxproj to add files or folders. To change a build setting, edit Config/*.xcconfig.
- Adding a Swift package changes the project file; ask the user first.
- To run on a device, set `DEVELOPMENT_TEAM` in Config/App.xcconfig.
- Debug builds use the `development` environment and Release builds use `production` (`APP_ENVIRONMENT` in Config/Debug.xcconfig and Release.xcconfig). To build another one: `xcodebuild APP_ENVIRONMENT=staging`.
<!-- geeknative:end -->

## Project rules

<!-- Your iOS-specific rules. They override the defaults above, and geeknative upgrades never touch them. -->
