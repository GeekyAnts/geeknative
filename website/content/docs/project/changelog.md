---
title: Changelog
description: Release notes for geeknative.
---

## Unreleased

- **One typeface everywhere:** `contracts/tokens.json` names a font family with one file per weight in `contracts/fonts`, and `make gen` bundles the same files into all three apps (registered at launch on iOS, font resources on Android, `@font-face` on the web). New projects start with Inter. `make font FAMILY="Open Sans"` switches to any Google Fonts family; `FAMILY=system` restores each platform's own font, in which case `make gen` checks that type sizes match their Dynamic Type styles.
- **One icon family everywhere:** `contracts/icons.json` names Lucide icons (or an SVG of yours in `contracts/icons`), and `make gen` draws each one natively: an asset catalog on iOS, vector drawables on Android, inline SVG components on the web. The apps no longer depend on `lucide-react` or `material-icons-core`. Icons can be marked `mirrored` for right-to-left layouts, and icon sizes are tokens (`AppIconSize.md`, `size-icon-md`).
- **Environments:** a new `contracts/config.json` declares environments and typed per-environment values, compiled into `AppConfig` and `AppEnvironment` on every platform. Debug builds use `development` and release builds use `production`.
- **Secrets:** `contracts/config.json` can declare secret names. Values come from a git-ignored `.env`: `make gen` writes them into git-ignored `AppSecrets` files on iOS and Android, and the web app reads them on the server. It also writes `.env.example`, and `make doctor` warns about missing keys.
- **CLI:** `GEEKNATIVE_ENV` (or `ENV=staging` with `make`) makes `check` and `run` build a chosen environment. `run` now regenerates first, and the Claude Code after-edit hook also regenerates when `.env` changes.
- **Upgrading a project:** add `contracts/config.json` (the starter has three environments and no values), set `APP_ENVIRONMENT` in `Config/Debug.xcconfig` and `Config/Release.xcconfig`, add the `appEnvironment` property and `buildConfig = true` to `app/build.gradle.kts`, add the two `AppSecrets` paths to `.gitignore`, then run `make gen`. For icons and fonts: rewrite `contracts/icons.json` as Lucide names (`"settings": "settings"`, `"back": { "icon": "arrow-left", "mirrored": true }`), change `Image(systemName: AppIcon.x)` to `Image(AppIcon.x)` on iOS, drop `lucide-react` from `apps/web/package.json` and `material-icons-core` from the Android build, add `"icon": { "sm": 16, "md": 24, "lg": 32 }` to `tokens.json`, call `AppFonts.register()` from `AppMain`'s `init`, then run `make font FAMILY=Inter` (or keep `"font": { "family": "system" }` and align type sizes with their iOS styles).

- **Consistency audit:**
  - The feature playbook's Verify step now has a checklist: string keys and icons used on every platform, no raw colors or sizes, matching names and IDs, labels, touch targets, and documented platform differences.
  - `apps/web/AGENTS.md` says the browser tab title is web chrome, so its separator is exempt from the no-literal-text rule.
  - Home is now tested on the rendered screen on Android and web, for all three criteria including AC-home-3 (the gear opens Settings). Android runs Compose UI tests on the JVM with Robolectric, so no emulator is needed. Web renders into happy-dom. These are test-only dependencies and don't ship in the apps. iOS tests AC-home-1 and AC-home-2 only at the value level, because SwiftUI exposes no accessibility tree to unit tests; AC-home-3 stays untested on iOS and is checked by hand.
  - A web test hydrates the server-rendered Settings screen with Dark stored and checks Dark is selected, which catches the Settings bug below.
  - On web, the header Settings link and the appearance rows are now 48 px tall (they were 40 px), and the web Settings feature has an `InMemorySettingsRepository`, like iOS and Android.
  - On iOS, the Settings `Form` now sits on the design tokens (`background` for the page, `surface` for the rows) instead of the system grouped background, which was pure black in dark mode. DESIGN.md says so. The section titles still use the system gray.
  - On web, opening `/settings` directly with Dark stored showed a dark page but System as the selected choice. The Settings view model now renders `system` until hydration is done, then the stored value. iOS and Android were not affected.
- **Known gaps:** raw sizes in app code (`48.dp` on Android, `size-4` and `size-6` on web) and the unused `home` icon are not fixed yet. The template does not commit a `package-lock.json`, so web dependencies resolve fresh on each `create`. That is how the `query-core` duplicate appeared; the `react-query` pin fixes it for now, and other transitive versions can still drift.
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
