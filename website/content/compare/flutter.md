---
title: geeknative vs Flutter
label: Flutter
order: 2
description: Flutter draws one UI everywhere with its own engine. geeknative builds each app with its platform's own UI toolkit from one spec. How they differ, and when to choose each.
---

Flutter and geeknative both target iOS, Android and the web. They differ in who draws the screen.

Flutter draws its own UI. You write widgets in Dart, and Flutter's rendering engine paints them on every platform, so the app looks the same everywhere. It includes Material and Cupertino widget sets that follow each platform's design.

geeknative uses each platform's own toolkit. The iOS app is SwiftUI, the Android app is Jetpack Compose, and the web app is React. A coding agent builds all three from one spec, and shared contracts keep the brand, copy and behavior the same.

## At a glance

| | Flutter | geeknative |
|---|---|---|
| Language | Dart | Swift, Kotlin and TypeScript |
| Who draws the UI | Flutter's engine, on every platform | SwiftUI, Jetpack Compose and the browser |
| Look across platforms | The same everywhere, unless you adapt it | Each platform's conventions, one brand through design tokens |
| Web | Flutter web, rendered by the engine | A React app on TanStack Start |
| Desktop | Windows, macOS and Linux | Not supported |
| Shared code | One codebase | None. The spec and contracts are shared |
| New platform features | Through plugins and platform channels | Directly, in Swift or Kotlin |
| Maturity | Many years in production, a large ecosystem | Version 0.1 |

## Choose Flutter when

- You want a pixel-identical, highly custom UI on every platform, like a game-like or illustration-heavy app.
- You need desktop apps from the same codebase.
- Your team knows Dart, or is happy to learn one language for everything.
- You want one codebase and its ecosystem of packages.

## Choose geeknative when

- You want apps that look and behave like their platform: iOS navigation, Material 3, platform text fields, sheets and gestures.
- Accessibility features like VoiceOver, TalkBack and Dynamic Type should come from the platform's own components.
- The web app should be a normal React app that your web team can work on and search engines can index like any site.
- You build with coding agents and want them to follow a spec with checks on every platform.

## The web is a different story

Flutter's web output is rendered by its engine, which suits app-like experiences. geeknative's web app is React on TanStack Start with Tailwind CSS, built from the same spec as the mobile apps. If the web is a core channel for you, that difference matters.

## Questions

### Does geeknative make the apps look the same?

They look like one brand, not identical. Colors, type, spacing and radii come from `contracts/tokens.json` and reach every app. Components and navigation follow each platform. See [Design changes](/docs/guides/design-changes/).

### Is three codebases more to maintain?

There is more code, but your agent writes it, and you maintain one spec. `make check` builds and tests all three apps, and `make parity` shows gaps. See [Specs and parity](/docs/concepts/specs-and-parity/).

## Related

- [geeknative vs React Native](/compare/react-native/)
- [geeknative vs Kotlin Multiplatform](/compare/kotlin-multiplatform/)
