---
title: How it works
description: The three layers that keep three codebases consistent, the loop every change follows, and what "done" means.
---

The three apps share no code. They behave the same because every change goes through shared docs and contracts first, and the agent keeps all three in step.

{{architecture}}

## Three layers

### 1. One source of truth, read by agents

| What | Where |
|---|---|
| What the product is, who it's for, glossary | PRODUCT.md |
| Visual language, components, what adapts per platform | DESIGN.md |
| How each feature behaves, with acceptance criteria | `spec/features/<id>.md` |
| Screens and routes | `spec/navigation.md` |
| Decisions and assumptions, dated | `spec/decisions.md` |

These are written for agents and people alike. When an implementation reveals something the spec didn't say, the spec is fixed first, then the apps.

### 2. Contracts compiled into every app

| What | Contract |
|---|---|
| App name, ID and version | `contracts/app.json` |
| Colors, spacing, radii and type | `contracts/tokens.json` |
| Backend URLs and other per-environment settings | `contracts/config.json` |
| All user-facing text | `contracts/strings/<locale>.json` |
| Icons (SF Symbols, Material, Lucide) | `contracts/icons.json` |

`make gen` compiles them into Swift, Kotlin, Android resources, TypeScript and a Tailwind theme. Generated files are committed and never edited by hand, and `make check` fails if they're out of date. See the [contracts reference](/docs/reference/contracts/).

### 3. The same architecture, with the same names

A feature called `notes` is `NotesScreen`, `NotesViewModel` and `NotesRepository` in every app, in each app's notes feature folder. One search finds all three implementations. See [Architecture](/docs/concepts/architecture/).

## The loop

Every change follows the same steps, from AGENTS.md:

1. **Update the source of truth**: the spec, DESIGN.md, PRODUCT.md or a contract.
2. **Regenerate** with `make gen` if contracts changed.
3. **Implement on each platform**, reading `apps/<platform>/AGENTS.md` first. Agents with sub-agents give each platform its own; only the lead edits `spec/`, `contracts/`, PRODUCT.md and DESIGN.md.
4. **Verify** with `make check-ios`, `make check-android` and `make check-web`, or `make check` for everything, and fix until they pass.
5. **Record** each platform's status in the feature's front matter, then run `make parity`.
6. **Report** one line per platform, the checks run, and the assumptions made.

## Keeping the apps aligned

- **Build from the spec, not by porting.** If the agent had to read another app's code to know how something should behave, the spec has a gap, and the spec gets fixed first.
- **Same IDs everywhere.** Test IDs (`notes.addButton`), storage keys and stored values match across apps.
- **Tests name acceptance criteria.** The ID (for example `AC-notes-2`) goes in each test's name, so `make parity` can show coverage.
- **Native, not identical.** Features, flows, data, copy and brand match. Navigation chrome, controls, gestures and system conventions follow each platform.
- **One feature at a time.** A feature is finished on every platform before the next one starts.
- **Spec changes ripple.** If building one platform changes the spec, the platforms already done get rechecked.

## Done means

- The docs and contracts describe the new behavior.
- `make gen` leaves no changes.
- Checks pass for every platform touched.
- Each platform's status is recorded and `spec/parity.md` is current.
- Anything left undone is in the report, with the reason.
