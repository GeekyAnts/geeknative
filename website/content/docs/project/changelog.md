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
