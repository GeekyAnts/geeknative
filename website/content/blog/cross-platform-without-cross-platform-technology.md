---
title: Cross-platform apps without cross-platform technology
label: Cross-platform without cross-platform technology
date: 2026-11-05
order: 1
description: For years, app teams chose between native quality and one shared codebase. Coding agents change that trade-off. Here is the idea behind geeknative.
---

Every team that ships an app on more than one platform has made the same decision. You can build natively, with each platform's own language and UI toolkit, and pay for it three times. Or you can share code with a cross-platform framework, and accept a layer between your app and the platform.

For a long time, the second option won on cost. Writing an app once is cheaper than writing it three times. That was the whole argument, and it was a good one.

## What coding agents change

Coding agents are very good at writing an implementation from a clear description. Given a spec, an agent can write a SwiftUI screen, then a Compose screen, then a React page, each in the idioms of its platform. The second and third implementations are no longer the expensive part.

What stays hard is consistency. Three implementations drift. A label changes on one platform. A rule is handled differently on another. A color is a shade off on the web. Without structure, an agent makes this worse, not better, because it can produce three slightly different apps very quickly.

So the problem moves. It is no longer "how do we avoid writing the app three times?" It is "how do we keep three native apps the same product?"

## Share everything except the code

geeknative's answer is to share everything that defines the product, and nothing that runs it.

- **The product and the behavior.** PRODUCT.md says what the app is and for whom. DESIGN.md says how it looks and what adapts per platform. Each feature has a spec in `spec/features/` with numbered acceptance criteria.
- **The brand and the copy.** App identity, design tokens, strings and icons live in `contracts/`. `make gen` compiles them into Swift, Kotlin, Android resources, TypeScript and a Tailwind theme. A color or a string has one source, so it can't drift.
- **The structure.** A feature called `notes` is `NotesScreen`, `NotesViewModel` and `NotesRepository` on every platform.
- **The tests.** Each platform's tests carry the acceptance criteria IDs. `make parity` shows which criteria each platform covers.

The code itself is plain SwiftUI, Jetpack Compose and React. No runtime, no bridge, no shared UI kit.

## One loop for every request

The last piece is the agent's behavior. AGENTS.md teaches any agent the same loop: work out what kind of request it is, update the source of truth first, build the change natively on each platform, verify with `make check`, record each platform's status and report.

You talk to your agent the way you always do: "add a notes list", "make it feel warmer", "the app crashes when I rotate". The loop keeps every answer consistent across three apps.

## When this is the right trade-off

This isn't the right choice for everyone. Teams with a healthy React Native or Flutter app, a strong JavaScript or Dart team, or a need for desktop apps have good reasons to stay where they are. We wrote honest comparisons with [React Native](/compare/react-native/), [Flutter](/compare/flutter/), [Capacitor and Ionic](/compare/capacitor-ionic/) and [Kotlin Multiplatform](/compare/kotlin-multiplatform/).

It is a strong choice when native quality matters, when you need new platform features as soon as they ship, and when your team already builds with coding agents. See the [use cases](/use-cases/) for examples.

## Try it

```sh
npm create geeknative@latest my-app -- --name "My App" --id com.acme.myapp
cd my-app
make doctor
make check
```

Then open the folder in your agent and describe your app. The [quick start](/docs/start-here/quick-start/) has the details.
