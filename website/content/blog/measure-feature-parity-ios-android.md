---
title: Feature parity between iOS and Android, measured
label: Measuring feature parity
date: 2026-11-05
order: 3
description: Most teams track iOS and Android parity in spreadsheets and release notes. geeknative ties acceptance criteria to test names, so parity becomes a report you can run.
---

Ask a team with two native apps whether iOS and Android do the same thing, and you will usually get a hopeful answer. Parity lives in a spreadsheet, a release checklist or someone's memory. Gaps show up when users find them.

geeknative treats parity as something you measure. The mechanism is small: a numbering scheme and a search.

## Acceptance criteria with IDs

Every feature has a spec in `spec/features/<id>.md`. Its acceptance criteria are testable, platform-neutral statements, each with an ID:

```md
## Acceptance criteria
- AC-settings-1: Appearance defaults to System.
- AC-settings-2: Choosing an appearance applies it to the whole app immediately.
```

The spec's front matter also records each platform's status: `planned`, `in-progress`, `done`, or `n/a` when a platform skips a feature on purpose.

## Tests that carry the ID

Each platform's tests put the criterion ID in the test name:

```swift
@Test("AC-settings-1: appearance defaults to System")
```

```kotlin
@Test
fun `AC-settings-1 appearance defaults to System`() = runTest { ... }
```

```ts
test('AC-settings-1: appearance defaults to System', async () => { ... })
```

The agent writes tests this way because AGENTS.md tells it to, on every platform.

## One command for the report

`make parity` reads every spec, collects the criteria, and searches each app's tests for those IDs. It prints the gaps and writes `spec/parity.md`:

```text
! home       iOS done 0/3 · Android done 0/3 · Web done 2/3
             AC-home-1 untested on iOS
             ...
✔ settings   iOS done 4/4 · Android done 4/4 · Web done 4/4
Wrote spec/parity.md
```

That output is from the starter app, and it shows a real gap. Home's criteria are about what is on screen. The web app tests them by rendering the screen, but iOS and Android need UI tests, which are on the [roadmap](/docs/project/roadmap/). Parity shows the gap instead of hiding it.

## Why it matters

- **Product managers** see which behavior is verified where, without reading test code.
- **QA** gets traceability from requirement to test on each platform.
- **Engineering leads** can review a pull request by asking one question: did parity go up or down?
- **Coding agents** get a clear definition of done. A feature isn't finished until its criteria are covered on every platform it targets.

## Intentional differences

Some differences are on purpose. A spec's Platform notes section records them, and a platform's status can be `n/a`. In Claude Code, a stop hook asks once when a turn changed some apps but not others, so the difference is a decision someone made.

Read the full format in [Specs and parity](/docs/concepts/specs-and-parity/), or see how this helps teams with separate native apps in [Keep iOS, Android and web on the same features](/use-cases/product-teams/).
