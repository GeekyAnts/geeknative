---
title: Keep iOS, Android and web on the same features
label: Product teams
order: 2
description: For product and engineering teams whose native apps drift apart. One spec, compiled contracts and a parity report keep every platform on the same features, copy and brand.
---

Teams with separate native apps know the pattern. A feature ships on iOS first and reaches Android a quarter later. Copy differs between stores. The brand refresh lands on one platform and not the other. Every change becomes three tickets in three backlogs.

geeknative gives a coding agent the structure to build every change once in the spec and then natively on each platform, and it shows you where the platforms differ.

## What changes for the team

- **One backlog, not three.** A change starts in the spec. The agent builds it on iOS, Android and the web in the same turn, in parallel where the agent supports sub-agents.
- **Brand and copy can't drift.** App identity, design tokens, strings and icons live in `contracts/`. `make gen` compiles them into Swift, Kotlin, Android resources, TypeScript and Tailwind theme code. A color or a string has one source.
- **Parity is a table, not a hope.** Acceptance criteria are numbered, like `AC-notes-1`. Each app's tests carry those IDs in their names, and `make parity` reports which criteria each platform covers.
- **Engineers can move between apps.** A feature called `notes` is `NotesScreen`, `NotesViewModel` and `NotesRepository` on every platform, written in each platform's own idioms.

## A governed way to use coding agents

Many engineering leaders are asked to show what coding agents do for productivity. The hard part is not getting code written. It is keeping that code consistent, reviewed and tested.

geeknative is a working pattern for that. AGENTS.md teaches every agent the same loop:

1. Work out what kind of request it is: product, feature, design, copy, bug, platform-specific, engineering or a question.
2. Update the source of truth first: the spec, PRODUCT.md, DESIGN.md or a contract.
3. Build the change natively on each platform.
4. Verify with `make check`.
5. Record each platform's status in the spec and report one line per platform.

Reviewers read the spec change and the per-platform diffs. Nothing is hidden in a runtime. See [Working with your agent](/docs/guides/working-with-your-agent/).

## Start with one feature

You don't need to move a whole product at once. A practical pilot:

1. Create a geeknative project for a new feature area or a small companion app.
2. Copy your design tokens and key strings into `contracts/`, and run `make gen`.
3. Write the feature's spec with numbered acceptance criteria.
4. Ask your agent to build it, then compare the three results and the parity report.

The [specs and parity](/docs/concepts/specs-and-parity/) page shows the spec format and the report.

## What to know first

- geeknative creates new projects. It does not convert an existing codebase. To bring an existing app across, use it as the reference for the spec. See [Add the missing platform](/use-cases/add-a-platform/).
- iOS and Android UI tests are on the [roadmap](/docs/project/roadmap/). Today, parity is measured with unit tests on iOS and Android and with rendering tests on the web.
- There is no backend layer yet. Features call repository interfaces that you implement against your own APIs.

## Questions teams ask

### Can platforms differ on purpose?

Yes. A spec has a Platform notes section for intentional differences, and a platform's status can be `n/a`. The Claude Code stop hook asks once when a turn changed some apps but not others, so a difference is a decision, not an accident.

### Do we have to use Claude Code?

No. Any agent that reads AGENTS.md works, including Codex, Cursor, Gemini CLI and GitHub Copilot's coding agent. Claude Code gets extra integration: platform subagents and hooks. See [Other agents](/docs/guides/other-agents/).
