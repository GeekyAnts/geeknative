---
title: Replace a hybrid or WebView app with native apps
label: Hybrid apps
order: 4
description: Move a Capacitor, Ionic or Cordova app to real SwiftUI and Jetpack Compose screens, one feature at a time, without hiring separate iOS and Android teams.
---

Hybrid apps wrap a web app in a native WebView. They are a fast way to get into the app stores, and for many apps they are enough. They tend to show their limits in the same places: scrolling and gestures that don't feel native, accessibility that depends on the web layer, and platform features that need a plugin.

geeknative lets a coding agent build the native replacement for you: SwiftUI on iOS, Jetpack Compose on Android, and a React web app, all from one spec.

## Signs it's time

- Store reviews mention speed, smoothness or "it feels like a website".
- Users of VoiceOver or TalkBack report problems.
- The roadmap needs widgets, Live Activities, App Intents, Wear OS or other platform features, and the plugin you need doesn't exist or lags behind.
- Your web team owns the app, but nobody on it is an iOS or Android specialist.

## Why native solves it

Each geeknative app uses its platform's own components. Lists, navigation, text fields and sheets come from SwiftUI and Compose, so they behave the way people on that platform expect. Platform accessibility features like VoiceOver, TalkBack and Dynamic Type work with those components. New OS features are available as soon as the platform ships them, with no bridge in between.

The web stays first class. The third app is React on TanStack Start with Tailwind CSS, built from the same spec, so you don't lose the web product your team already knows.

## A migration path

1. **Write the spec from the app you have.** Your hybrid app is the reference. Ask your agent to fill in PRODUCT.md and `spec/navigation.md` from it.
2. **Move the brand into contracts.** Colors, type, spacing and copy go in `contracts/`, and `make gen` compiles them into every app.
3. **Pick a first feature.** Choose one that users notice, like the main list or the checkout flow. Write its spec with acceptance criteria.
4. **Build it on all three platforms.** The agent implements it natively and names tests after the criteria. `make check` builds and tests every app.
5. **Repeat feature by feature.** Ship when the native apps cover what the hybrid app does.

## What to know first

- geeknative builds new apps. It doesn't convert web code into native code, and there is no automated migration tool.
- There is no backend layer yet. Your existing APIs stay, behind repository interfaces in each app.
- iOS builds need a Mac with Xcode.

## Related

- [geeknative vs Capacitor and Ionic](/compare/capacitor-ionic/)
- [Add the missing platform](/use-cases/add-a-platform/)
- [Platforms reference](/docs/reference/platforms/)
