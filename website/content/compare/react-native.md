---
title: geeknative vs React Native
label: React Native
order: 1
description: React Native shares one JavaScript codebase across platforms. geeknative keeps three native codebases and shares the spec instead. How they differ, and when to choose each.
---

React Native and geeknative both get you apps on iOS, Android and the web. They make opposite bets on what to share.

React Native shares the code. You write React components in JavaScript or TypeScript, and they render to native views on each platform, with a JavaScript engine running your app logic. geeknative shares everything except the code: the product spec, design tokens, copy, icons and tests. A coding agent writes the app three times, natively, and the shared contracts keep the three apps one product.

Both are good choices. GeekyAnts, which maintains geeknative, also builds React Native apps and maintains React Native UI libraries. This page is about fit, not winners.

## At a glance

| | React Native | geeknative |
|---|---|---|
| What is shared | App code (React, JavaScript or TypeScript) | Spec, design tokens, copy, icons, test criteria |
| iOS UI | Native views driven from React | SwiftUI |
| Android UI | Native views driven from React | Jetpack Compose with Material 3 |
| Web | React Native Web, or a separate React app | React on TanStack Start with Tailwind CSS |
| Runtime between your code and the OS | A JavaScript engine (Hermes) and the React Native framework | None. Plain SwiftUI, Compose and React |
| New platform features | Through native modules, yours or the community's | Directly, in Swift or Kotlin |
| Who writes the code | Your team, with or without an agent | Your coding agent, reviewed by your team |
| Over-the-air updates for mobile | Yes, for JavaScript changes | No. Mobile changes ship through the stores |
| Maturity | Many years in production, a very large ecosystem | Version 0.1, first released in October 2026 |

## Choose React Native when

- Your team is strong in React and JavaScript, and you want one codebase to own.
- You rely on over-the-air updates to ship JavaScript changes without a store release.
- The ecosystem matters: libraries, Expo, hiring and a long production track record.
- Your app already runs on React Native and works well. A rewrite is rarely worth it for its own sake.

## Choose geeknative when

- You want each app to be fully native: SwiftUI and Compose, with no framework layer to upgrade or debug.
- You need new platform features early, like widgets, Live Activities or App Intents, without waiting for a module.
- You build with coding agents and want them to follow a spec-first loop with checks on every platform.
- You want a spec, contracts and a parity report that describe the product apart from any codebase.

## Coding agents change the maths

The classic argument for sharing code is cost: one codebase is cheaper to write than three. Coding agents change that, because writing a second and third implementation is no longer the expensive part. Keeping them consistent is.

That is the problem geeknative works on. Every change goes into the spec or a contract first. `make gen` compiles the contracts into every app. Tests carry acceptance criteria IDs, and `make parity` shows which criteria each platform covers. See [How it works](/docs/concepts/how-it-works/).

## Can you use both?

Yes. A common path is to keep an existing React Native app and use geeknative for something new: a companion app, a platform-specific feature, or a separate product. Nothing in geeknative depends on what your other apps use.

## Questions

### Is React Native not native?

React Native renders platform views, so its UI is native in that sense. The difference is the layer in between: your app logic runs in JavaScript, and platform APIs are reached through the framework or native modules. geeknative has no such layer.

### Does geeknative need more engineers?

It needs people who can review Swift, Kotlin and TypeScript, because that is the code your agent writes. It doesn't need three teams writing it.

## Related

- [geeknative vs Flutter](/compare/flutter/)
- [Cross-platform apps without cross-platform technology](/blog/cross-platform-without-cross-platform-technology/)
