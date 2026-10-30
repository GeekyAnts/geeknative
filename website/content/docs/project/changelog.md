---
title: Changelog
description: Release notes for geeknative.
---

## Unreleased

- **Environments:** a new `contracts/config.json` declares environments and typed per-environment values, compiled into `AppConfig` and `AppEnvironment` on every platform. Debug builds use `development` and release builds use `production`.
- **Secrets:** `contracts/config.json` can declare secret names. Values come from a git-ignored `.env`: `make gen` writes them into git-ignored `AppSecrets` files on iOS and Android, and the web app reads them on the server. It also writes `.env.example`, and `make doctor` warns about missing keys.
- **CLI:** `GEEKNATIVE_ENV` (or `ENV=staging` with `make`) makes `check` and `run` build a chosen environment. `run` now regenerates first, and the Claude Code after-edit hook also regenerates when `.env` changes.
- **Upgrading a project:** add `contracts/config.json` (the starter has three environments and no values), set `APP_ENVIRONMENT` in `Config/Debug.xcconfig` and `Config/Release.xcconfig`, add the `appEnvironment` property and `buildConfig = true` to `app/build.gradle.kts`, add the two `AppSecrets` paths to `.gitignore`, then run `make gen`.

- **Consistency audit:**
  - The feature playbook's Verify step now has a checklist: string keys and icons used on every platform, no raw colors or sizes, matching names and IDs, labels, touch targets, and documented platform differences.
  - `apps/web/AGENTS.md` says the browser tab title is web chrome, so its separator is exempt from the no-literal-text rule.
  - Home now has tests for AC-home-1 and AC-home-2 on iOS and Android. They check that the app name and strings exist and that Home builds, but they can't read the text on screen. AC-home-3 (the Settings entry point) is still untested on every platform, because it needs a UI test harness. It is recorded as UI-test-only in the Home spec, and `make parity` keeps showing it as untested.
  - On web, the header Settings link and the appearance rows are now 48 px tall (they were 40 px), and the web Settings feature has an `InMemorySettingsRepository`, like iOS and Android.
  - DESIGN.md records that the iOS Settings `Form` uses the system grouped background.
- **Known gaps:** raw sizes in app code (`48.dp` on Android, `size-4` and `size-6` on web) and the unused `home` icon are not fixed yet.
- **Applying the audit changes to an existing project:** `geeknative upgrade` is not built yet, so copy them by hand. The playbook and the managed block in `apps/web/AGENTS.md` are framework files. The touch targets, the in-memory repository, the Home tests, DESIGN.md and the Home spec belong to your project. If `make check-web` fails with a type error in `router.tsx` (two copies of `@tanstack/query-core`), set `@tanstack/react-query` to `5.105.0` in `apps/web/package.json` and reinstall.

## 0.1.0 (2026-10-10)

The first release.

- **CLI:** `create`, `gen`, `check`, `doctor`, `parity` and `run`, published as `geeknative` with `npm create geeknative` (`create-geeknative`).
- **Template:**
  - AGENTS.md that triages plain prompts and routes them to PRODUCT.md, DESIGN.md, specs or contracts, plus one AGENTS.md per app and playbooks for each request type.
  - Three apps with matching Home and Settings screens: SwiftUI (iOS 17 and later), Kotlin and Jetpack Compose (Android 7.0 and later), and React on TanStack Start.
  - Contracts for app identity, design tokens, strings (with placeholders, plurals and locales) and icons, compiled into every app.
  - Feature specs with acceptance criteria IDs, and parity reporting.
- **Agents:** CLAUDE.md imports, `ios-engineer`, `android-engineer` and `web-engineer` subagents, and hooks for Claude Code; a Gemini CLI setting; Dependabot configuration.
- **Ownership:** a lockfile recording framework file hashes, ready for future upgrades.
- **License:** Apache 2.0.
