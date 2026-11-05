---
title: Migrate a Xamarin app to SwiftUI and Jetpack Compose
label: Xamarin apps
order: 5
description: Microsoft ended support for Xamarin in May 2024. Rebuild your app on modern native stacks for iOS, Android and the web, using the app you have as the spec.
---

Microsoft ended support for Xamarin and Xamarin.Forms on 1 May 2024. Apps built with them no longer get updates for new iOS and Android SDKs. Microsoft's own path is .NET MAUI. Many teams take the move as a chance to rethink the stack instead.

If you want native apps, geeknative gives you a direct route. A coding agent builds the app in SwiftUI for iOS, Jetpack Compose for Android and React for the web, from one spec that you write from your current app.

## Your options

| Option | What you get | What to weigh |
|---|---|---|
| Move to .NET MAUI | C# and a shared codebase, closest to what you have | Another cross-platform layer; your team stays in .NET |
| Rewrite in React Native or Flutter | One shared codebase in JavaScript or Dart | A new language and runtime for the team |
| Rebuild natively with geeknative | Three native apps from one spec, written by a coding agent | Native code to review on each platform |

There is no wrong answer. If your team is strong in .NET and the app is mostly forms and data, MAUI may be the shortest path. If native look, feel and platform features matter, a native rebuild is worth it, and a coding agent makes it affordable.

## How the rebuild works

1. **Inventory the app.** List every screen and feature. Ask your agent to turn that into PRODUCT.md and `spec/navigation.md`.
2. **Write specs from current behavior.** One spec per feature in `spec/features/`, with numbered acceptance criteria. Existing test plans are a good source.
3. **Move the brand and copy.** Colors and type go in `contracts/tokens.json`. Strings go in `contracts/strings/`, including other locales. `make gen` compiles them into every app.
4. **Keep your backend.** Implement each feature's repository against your existing services.
5. **Build feature by feature.** Each feature goes through all three apps before the next starts. `make parity` shows coverage per platform.

## What you end up with

- An iOS app in SwiftUI with `@Observable` view models, for iOS 17 and later.
- An Android app in Kotlin and Jetpack Compose with Material 3, for Android 7.0 and later.
- A web app in React 19 on TanStack Start with Tailwind CSS v4.
- A spec and contracts your team keeps, so the next migration is never this hard.

## What to know first

- There is no automated converter. The agent builds new apps from specs, not from C# code.
- Check the minimum versions against your users. Xamarin apps often supported older devices.
- geeknative is at version 0.1. Upgrades for existing projects are on the [roadmap](/docs/project/roadmap/).

## Related

- [Add the missing platform](/use-cases/add-a-platform/)
- [geeknative vs Kotlin Multiplatform](/compare/kotlin-multiplatform/)
- [Requirements](/docs/start-here/requirements/)
