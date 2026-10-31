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

- **Fixes from building a real app (Minutely, a quick commerce app):**
  - **Web widths:** spacing tokens named `sm`, `md`, `xl` (the template's names) took over Tailwind's width utilities, so `max-w-md` came out as 12px and squeezed text to one word per line. `tokens.css` now keeps `w-*`, `min-w-*` and `max-w-*` on Tailwind's container sizes.
  - **Web layout:** the app shell is full width with side padding, instead of a centered 42rem column with wide empty margins on desktop.
  - **Screen titles:** DESIGN.md requires leading-aligned titles on every platform (iOS large titles, Android `TopAppBar`, a left-aligned web `h1`), and the lint flags `.navigationBarTitleDisplayMode(.inline)` and `CenterAlignedTopAppBar`.
  - **Motion and elevation tokens:** `tokens.json` can define durations, easing curves, springs and shadows. They become `AppMotion` and `AppElevation` on iOS and Android, and `duration-*`, `ease-*` and `shadow-*` on the web. A spring is a duration and a bounce, mapped exactly onto Compose's physics and sampled into a CSS `linear()` curve. New projects get defaults.
  - **`make check-ios`:** about a minute instead of seven or more. Parallel testing (which cloned and booted a simulator on every run) is off, the build reports its phases and a heartbeat instead of staying silent, and the simulator is always an iPhone on the newest iOS runtime instead of whichever one was booted. `check-android`, `run-ios` and `run-android` report progress too.
  - **Android tests:** `unitTests.isReturnDefaultValues` is now `false`, so a plain unit test that calls an Android API fails instead of silently getting `null`, `0` or `false`.
  - **iOS UI tests:** the template has an `AppUITests` target (XCUITest), run by `make check-ios`. AC-home-3 is now tested by tapping on all three platforms.
  - **(ui) criteria:** a spec can mark a criterion `(ui)`. Parity then counts it only when a test drives the real UI, and shows 🟡 when only view-model or route tests name it.
  - **`geeknative lint`** (and `make lint`, run by `make check`): fails on user-facing text in code, test IDs no spec lists, centered titles, a `planned` status with passing tests and a stale `spec/parity.md`, and warns about spec test IDs a finished app never uses and changes to only some apps.
  - **Pinned CLI:** a project created from a geeknative checkout is pinned to a snapshot of it (`.geeknative/geeknative-<version>-<commit>.tgz`) instead of a symlink that followed whatever branch the checkout had open. `create --link` keeps the old behavior for working on geeknative. `make doctor` says where the CLI comes from, and `make doctor FIX=1` pins a linked project.
  - **Outside the project folder:** AGENTS.md and the Claude Code guide explain that the hooks and platform agents only load when a session starts in the project folder, and `make check` now enforces what the hooks did.
- **Fixes from building a second app (Meetly, a meeting calendar):**
  - **Plural `zero` forms** are used for a count of 0 on every platform. iOS did this already; the web's `plural()` now does, and Android gets a generated `AppPlurals` (use it instead of `pluralStringResource`). Before, "No meetings" on iOS was "0 meetings" on Android and the web.
  - **Android `java.time`:** the template enables core library desugaring, so date and time code works on API 24 and 25.
  - **Web content width:** a `Page` component centers a screen's content in a readable column (or uses the full width with `width="full"`), and the template's Home and Settings use it. Forms no longer stretch across the window or hug its left edge.
  - **Parity** counts UI tests that render through a shared helper (web tests in happy-dom or jsdom, Android tests that find Compose nodes).
  - **Lint:**
    - the web text rules apply to `.tsx` only, so TypeScript generics are no longer flagged;
    - only preview blocks are skipped, not the code after them;
    - test IDs passed to helper components are checked;
    - test-only changes don't count as one-platform work;
    - `lint ios`, `lint android` and `lint web` check one app's code;
    - a platform check says it skipped the specs, and spec findings say they belong to the lead.
  - **Progress:** the heartbeat names the test that's running, so slow iOS UI tests don't look like a hang.
  - **Template:**
    - a shared `renderApp` helper for web UI tests;
    - iOS Settings tests that clean up their UserDefaults suites;
    - the web docs recommend the native `<dialog>`;
    - the Android docs explain zeroing Material's own elevation under token shadows.
- **More fixes from the Meetly test:**
  - **Android splash in Dark mode:** the app registers the chosen appearance with the system (`UiModeManager.setApplicationNightMode`, Android 12+), so a cold start's splash screen is in it too.
  - **`make run-android`** reports "running" only once the app is on screen, with how long it took.
  - **Lint:** a web screen that caps its width without centering it is an error. `make lint-ios`, `lint-android` and `lint-web` lint one app.
  - **Docs:**
    - the web AGENTS.md explains which width and size classes use the spacing tokens, and to restart `vite preview` after a build;
    - the iOS AGENTS.md covers confirmation dialogs in iOS 26+ UI tests;
    - the feature playbook says to add strings for picker and dialog buttons.
- **Test IDs a platform can't use:** a spec's Test IDs bullet can say `(not on iOS)` (or Android, web), and the lint stops expecting that ID there. The lint also no longer lets an all-dynamic string like `"${total}"` count as every listed ID.
- **Size tokens:** `tokens.json` can define a `size` group for touch targets and other fixed sizes, generated as `AppSize` on iOS and Android and as `size-*` / `min-h-*` classes on the web. The template's `touchTarget` is 48, used for its Android and web touch targets.
- **`geeknative pin`** (`make pin`) moves a project created from a checkout to a fresh snapshot of that checkout, removing the old one. Snapshots record where they came from, and `make doctor` warns when the checkout has moved past the project's snapshot.
- **Applying these to an existing project:** run `make doctor FIX=1` from a checkout to pin the CLI, then `make gen` (new `tokens.css` mappings) and `make parity`, and fix what `make lint` reports. The motion and elevation tokens, the full-width web shell, the iOS UI test target and the Android test setting belong to your project: copy them from the template if you want them.

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
