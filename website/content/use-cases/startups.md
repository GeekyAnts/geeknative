---
title: Launch native iOS, Android and web apps for your startup
label: Startups
order: 1
description: Build your startup's app natively on iOS, Android and the web from one spec, with the coding agent you already use. No three teams, no rewrite after product-market fit.
---

Most startups face the same choice on day one. Build natively and pay for three platforms, or pick a cross-platform framework and accept its trade-offs. Many pick the second, then plan a rewrite once the product works.

geeknative removes that choice. Your coding agent writes a SwiftUI app, a Jetpack Compose app and a React web app from one spec. You review one description of the product. The agent keeps the three apps in step.

## Why it fits an early team

- **One or two engineers can ship three apps.** The agent does the per-platform work. You own the spec, the review and the decisions.
- **Native from the first release.** Each app uses its platform's own components, navigation and conventions. Nothing to migrate later.
- **The spec is an asset.** PRODUCT.md, DESIGN.md and one spec per feature describe what you built. A new hire, an investor's technical advisor or a future team can read it.
- **No lock-in.** The apps are plain SwiftUI, Compose and React. There is no runtime to depend on, and the project is open source under Apache 2.0.

## How to start

Create a project and check your machine:

```sh
npm create geeknative@latest my-app -- --name "My App" --id com.acme.myapp
cd my-app
make doctor
make check
```

Then open the folder in Claude Code, Codex, Cursor, Gemini CLI or another agent that reads AGENTS.md, and describe the whole product in your first prompt:

> Build a habit tracker. People create habits, check them off each day, and see their current streak.

The agent treats this as a product request. It fills in PRODUCT.md, sets the design direction in DESIGN.md and `contracts/tokens.json`, plans the screens in `spec/navigation.md`, and writes one spec per feature. Then it builds one feature at a time across all three apps. See [From idea to three apps](/docs/guides/idea-to-three-apps/) for each step.

## What to review as a founder

You don't need to read three codebases. Review the files that define the product:

| File | Ask yourself |
|---|---|
| PRODUCT.md | Is the one-sentence description right? Is anything out of scope? |
| `spec/navigation.md` | Is the screen structure right? It is expensive to change later. |
| `spec/features/*.md` | Are the acceptance criteria what you would test by hand? |
| `spec/parity.md` | Which criteria each platform's tests cover. |

Run each app with `make run-ios`, `make run-android` and `make run-web` to try it.

## What to know first

- **There is no backend yet.** Features read and write through repository interfaces with local implementations. You can add a backend later without changing screens. See [Architecture](/docs/concepts/architecture/).
- **iOS builds need a Mac.** Xcode runs on macOS only. Linux builds the Android and web apps. See [Requirements](/docs/start-here/requirements/).
- **Minimum versions** are iOS 17, Android 7.0 and current browsers. Check that they match your audience.
- **It is an early release.** Version 0.1 is the foundation. The [roadmap](/docs/project/roadmap/) lists what is planned.

## Questions founders ask

### Do I need to know Swift and Kotlin?

It helps to read the code your agent writes, but you don't need to write it. The specs, contracts and checks do most of the work of keeping the apps correct. `make check` builds and tests all three.

### Should I start with one platform?

If you only need to test an idea, a single platform is fine, and geeknative still gives you a spec to grow from. If your users are on both stores, starting with all three costs little more than starting with one.

### How is this different from React Native or Flutter?

Those frameworks share code at runtime. geeknative shares the spec, the design tokens, the copy and the tests, and keeps three native codebases. See [geeknative vs React Native](/compare/react-native/) and [geeknative vs Flutter](/compare/flutter/).
