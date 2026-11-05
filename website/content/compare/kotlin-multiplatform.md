---
title: geeknative vs Kotlin Multiplatform
label: Kotlin Multiplatform
order: 4
description: Kotlin Multiplatform shares Kotlin code across platforms and can keep the UI native. geeknative shares the spec and contracts and keeps every layer native. How they differ, and when to choose each.
---

Kotlin Multiplatform (KMP) and geeknative are closer than most comparisons. Both can give you a SwiftUI app on iOS and a Compose app on Android. They share different things.

KMP shares Kotlin code. Business logic, networking and data layers are written once in Kotlin and compiled for each platform. The UI can stay native on each platform, or be shared too with Compose Multiplatform.

geeknative shares no code at all. It shares the product spec, design tokens, copy, icons and test criteria. A coding agent writes every layer natively on each platform, and the contracts keep the apps consistent.

## At a glance

| | Kotlin Multiplatform | geeknative |
|---|---|---|
| What is shared | Kotlin code: logic, data, optionally UI | Spec, design tokens, copy, icons, test criteria |
| iOS | Swift or SwiftUI UI calling shared Kotlin, or Compose Multiplatform | SwiftUI and Swift throughout |
| Android | Kotlin and Compose | Kotlin and Compose |
| Web | Kotlin/Wasm or Kotlin/JS | React on TanStack Start |
| Desktop | Yes | Not supported |
| Who writes the code | Your team, with or without an agent | Your coding agent, reviewed by your team |
| Maturity | Supported by JetBrains and Google, in production at many companies | Version 0.1 |

## Choose Kotlin Multiplatform when

- Your team is strong in Kotlin and wants one implementation of complex business logic.
- The logic is the hard part: offline sync, calculations, rules engines.
- You need desktop targets too.

## Choose geeknative when

- Your iOS team should work in Swift end to end, without a Kotlin framework in the app.
- The web app should be a standard React app.
- You build with coding agents and want the agent, not shared code, to do the cross-platform work.
- You want a spec and parity report that describe the product apart from any language.

## Can they work together?

In principle, yes. geeknative features call repository interfaces, so a team could implement those against a shared Kotlin module on Android and iOS. geeknative doesn't set this up for you today.

## Related

- [geeknative vs Flutter](/compare/flutter/)
- [Architecture](/docs/concepts/architecture/)
