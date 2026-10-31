<!-- geeknative:begin (managed by geeknative: replaced on upgrade. Add your own rules under "Project rules" at the end.) -->
# How to work in this repo

This repo is **one product, built three times, natively**: iOS (SwiftUI), Android (Kotlin + Jetpack Compose) and web (React + TanStack Start). The apps share no code. They behave the same because every change goes through shared docs and contracts first, and you keep all three in step.

## 1. Every request is for all three apps

Unless the user names a platform ("on Android, ...") or the spec marks something as platform-only, a request is done only when iOS, Android **and** web all do it.

## 2. Triage first, and say it in one line

Before changing anything, decide what kind of request it is. State it as the first line of your reply, so the user can correct you early:

> **Feature:** notes list → spec/features/notes.md, strings · iOS, Android, Web

| The request...                                      | Type              | Update first                                             | Playbook                                    |
|-----------------------------------------------------|-------------------|----------------------------------------------------------|---------------------------------------------|
| describes an app, or changes what it is or who it's for | Product       | PRODUCT.md, DESIGN.md, spec/navigation.md, feature specs | .geeknative/playbooks/product.md            |
| adds a screen, flow or capability                   | Feature           | a new `spec/features/<id>.md`                            | .geeknative/playbooks/feature.md            |
| changes how something existing behaves              | Behavior change   | that feature's spec                                      | .geeknative/playbooks/feature.md            |
| changes the look and feel                           | Design            | DESIGN.md and/or contracts/tokens.json                   | .geeknative/playbooks/design.md             |
| changes wording only                                | Copy              | contracts/strings/*.json, then `make gen`                | none                                        |
| reports something broken                            | Bug               | the spec, only if it was silent or wrong                 | .geeknative/playbooks/bug.md                |
| names one platform                                  | Platform-specific | the feature's "Platform notes", if users can see it      | .geeknative/playbooks/platform-specific.md  |
| is about tooling, dependencies, builds, environments or refactoring | Engineering     | nothing                                                  | .geeknative/playbooks/engineering.md        |
| asks a question                                     | Question          | nothing: answer it, don't edit files                     | none                                        |

- A request can be several types at once (a feature usually adds copy too).
- Keep it proportional: small tweaks don't need new spec files. Update a doc only when what it says changes.
- If the user says "plan", "spec only" or "don't build yet", stop after updating the docs.

## 3. Where things live

| What | Source of truth |
|---|---|
| What the product is, who it's for, glossary | PRODUCT.md |
| Visual language, components, what adapts per platform | DESIGN.md |
| How each feature behaves, with acceptance criteria | `spec/features/<id>.md` (start from .geeknative/templates/feature.md) |
| Screens and routes | spec/navigation.md |
| Decisions and assumptions, dated | spec/decisions.md |
| App name, ID and version | contracts/app.json |
| Backend URLs, feature flags and other per-environment settings | contracts/config.json |
| Secret keys (names only; values live in .env and are never committed) | contracts/config.json `secrets` |
| Colors, spacing, radii, icon sizes and type | contracts/tokens.json |
| The typeface, one for all three apps | contracts/tokens.json `font`, with the files in contracts/fonts (`make font FAMILY=...`) |
| All user-facing text | `contracts/strings/<locale>.json` |
| Icons (Lucide names, or your own SVGs in contracts/icons) | contracts/icons.json |
| Which platform has what | feature front matter → `make parity` → spec/parity.md |

`make gen` compiles contracts/ into each app (`Generated/` with `Icons.xcassets` and `Fonts/`, `generated/` including `AppConfig`, `generated_*.xml`, `res/drawable/generated_*`, `res/font/generated_*`, `Identity.xcconfig`, `identity.properties`, `.env.example`). `AppSecrets.swift` and `AppSecrets.kt` are built from `.env` and git-ignored. Never edit generated files: change the contract and regenerate.

## 4. The loop

1. **Update the source of truth** (section 3).
2. **Regenerate** with `make gen` if contracts changed.
3. **Implement on each platform.** Before editing under `apps/<platform>/`, read `apps/<platform>/AGENTS.md`.
   - If you can run sub-agents in parallel, give each platform its own, with the spec path, the acceptance criteria IDs and what changed in contracts/. Only you, the lead, edit `spec/`, `contracts/`, PRODUCT.md and DESIGN.md; platform agents report gaps back to you.
   - Otherwise, do the platforms one after another.
4. **Verify** with `make check-ios`, `make check-android` and `make check-web` (or `make check` for everything). Fix until they pass. Each one also lints that app's code: user-facing text written in code, test IDs no spec lists, and centered screen titles.
5. **Record** each platform's status in the feature's front matter, then run `make parity`.
6. **Report** one line per platform (done, partial or skipped, and why), the checks you ran, and any assumptions you made.

## 5. Keeping the apps aligned

- **Build from the spec, not by porting.** Don't translate another app's code. If you had to read another app's code to know how something should behave, the spec has a gap: fix the spec first.
- **Same names everywhere.** A feature `notes` is `NotesScreen`, `NotesViewModel` and `NotesRepository` in every app, in each app's notes feature folder. One search finds all three.
- **Same IDs everywhere.** Test IDs (`notes.addButton`), storage keys and stored values match across apps.
- **Tests name acceptance criteria.** Put the ID (for example `AC-notes-2`) in each test's name, so `make parity` can show coverage.
- **Native, not identical.** Features, flows, data, copy and brand match. Navigation chrome, controls, gestures and system conventions follow each platform. DESIGN.md says which is which.
- **One feature at a time.** Finish a feature on every platform before starting the next.
- **Spec changes ripple.** If building one platform changes the spec, recheck the platforms you already did.
- **No backend yet.** Features read and write through a repository interface with local implementations. When a backend arrives, only the repositories change. Put its URLs in contracts/config.json, one per environment.

## 6. Ask or assume

Ask only when a wrong guess is expensive to undo: the data model, the navigation structure, deleting features or data, or anything irreversible. Otherwise pick the conventional option, note it under "Assumptions" in the spec (and in spec/decisions.md if it affects more than one feature), and mention it in your report.

## 7. Done means

- The docs and contracts describe the new behavior.
- `make gen` leaves no changes.
- Checks pass for every platform you touched, and the full `make check` passes: it also lints the specs (stale statuses, an out-of-date spec/parity.md).
- Each platform's status is recorded and spec/parity.md is current.
- Anything left undone is in your report, with the reason.

## Commands

| Command | What it does |
|---|---|
| `make doctor` | Checks Xcode, the Android SDK, Java and Node (`make doctor FIX=1` installs what it can) |
| `make gen` | Regenerates app code from contracts/ |
| `make font FAMILY="Open Sans"` | Switches the typeface of all three apps to a Google Fonts family (`FAMILY=system` for each platform's own) |
| `make check` | Validates contracts, then builds and tests all three apps |
| `make check-ios`, `make check-android`, `make check-web` | One app; full logs go to .geeknative/logs/ |
| `make run-ios`, `make run-android`, `make run-web` | Builds and launches one app |
| `make parity` | Updates spec/parity.md |
| `make pin` | For a project created from a geeknative checkout: moves it to a fresh snapshot of that checkout (`make doctor` says when there's a newer one) |
| `make lint` | Finds hardcoded text, test IDs no spec lists, centered titles, stale statuses and a stale parity.md (`make check` runs it too) |

**Working from outside this folder.** Claude Code loads this project's hooks and platform agents (.claude/) only when the session starts in this folder. If yours started elsewhere (a parent folder, another repo), they aren't active: run `make gen` yourself after every contract edit, brief general-purpose agents with the platform's AGENTS.md, and rely on `make check`, which enforces the same rules as the hooks. Better: start the session in this folder.

Add `ENV=staging` (or another environment from contracts/config.json) to `make check*` and `make run-*` to build that environment instead of the default.
<!-- geeknative:end -->

## Project rules

<!-- Your own rules go here. They override the defaults above, and geeknative upgrades never touch them. -->
