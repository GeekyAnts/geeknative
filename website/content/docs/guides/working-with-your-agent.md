---
title: Working with your agent
description: How plain prompts become changes in all three apps, and how to get the best results.
---

You don't need special commands. Describe what you want, the way you would to a teammate. The root `AGENTS.md` tells the agent what to do with it.

## Every request is for all three apps

Unless you name a platform ("on Android, ...") or the spec marks something as platform-only, a request is done only when iOS, Android and web all do it.

## The agent triages first, out loud

Before changing anything, the agent decides what kind of request it is and says so in the first line of its reply:

> **Feature:** notes list → spec/features/notes.md, strings · iOS, Android, Web

If it read you wrong, correct it before any work happens.

| The request... | Type | Updated first | Playbook |
|---|---|---|---|
| describes an app, or changes what it is or who it's for | Product | PRODUCT.md, DESIGN.md, spec/navigation.md, feature specs | `.geeknative/playbooks/product.md` |
| adds a screen, flow or capability | Feature | a new `spec/features/<id>.md` | `.geeknative/playbooks/feature.md` |
| changes how something existing behaves | Behavior change | that feature's spec | `.geeknative/playbooks/feature.md` |
| changes the look and feel | Design | DESIGN.md and/or `contracts/tokens.json` | `.geeknative/playbooks/design.md` |
| changes wording only | Copy | `contracts/strings/*.json`, then `make gen` | none |
| reports something broken | Bug | the spec, only if it was silent or wrong | `.geeknative/playbooks/bug.md` |
| names one platform | Platform-specific | the feature's "Platform notes", if users can see it | `.geeknative/playbooks/platform-specific.md` |
| is about tooling, dependencies, builds or refactoring | Engineering | nothing | `.geeknative/playbooks/engineering.md` |
| asks a question | Question | nothing: the agent answers and doesn't edit files | none |

A request can be several types at once: a feature usually adds copy too. Small tweaks don't get new spec files; the agent updates a doc only when what it says changes.

## Example prompts

| You type | What happens |
|---|---|
| "Build a habit tracker where people check off habits daily and see streaks." | **Product.** PRODUCT.md, DESIGN.md, navigation and one spec per feature, then features built one at a time on all three apps. |
| "Add a notes list where I can add and delete notes." | **Feature.** `spec/features/notes.md` with acceptance criteria, new strings, then `NotesScreen`, `NotesViewModel` and `NotesRepository` in each app. |
| "Sort notes by when they were last edited." | **Behavior change.** The notes spec changes first, then all three apps. |
| "Make it feel warmer, with rounder corners." | **Design.** DESIGN.md's direction and `contracts/tokens.json`, then `make gen`. |
| "Rename the Save button to Done." | **Copy.** One edit in `contracts/strings/en.json` and `make gen`. |
| "The app crashes when I delete the last note." | **Bug.** Fixed where it breaks, then the other two apps are checked for the same mistake, with a regression test. |
| "On iPhone, add a haptic when a note is deleted." | **Platform-specific.** iOS only, recorded in the feature's Platform notes so nobody "fixes" the difference later. |
| "Why does Android use radio buttons for the appearance setting?" | **Question.** Answered from DESIGN.md and the spec. Nothing changes. |

## Plan before building

Say "plan", "spec only" or "don't build yet" and the agent stops after updating the docs. Review the spec, then ask it to build.

## When the agent asks, and when it assumes

The agent asks only when a wrong guess would be expensive to undo: the data model, the navigation structure, deleting features or data, or anything irreversible. Otherwise it picks the conventional option, notes it under "Assumptions" in the spec (and in `spec/decisions.md` if it affects more than one feature), and mentions it in its report.

## What "done" means

The agent finishes when:

- the docs and contracts describe the new behavior;
- `make gen` leaves no changes;
- checks pass for every platform it touched;
- each platform's status is recorded in the feature's front matter and `spec/parity.md` is current;
- anything left undone is in its report, with the reason.

Its report has one line per platform (done, partial or skipped, and why), the checks it ran, and the assumptions it made.

## Tips

- **One feature at a time.** The agent finishes a feature on every platform before starting the next. Big asks work best as a sequence of features.
- **Review the spec diff.** It's the shortest description of what changed in three codebases.
- **Name a platform only when you mean it.** "On Android" makes a change Android-only.
- **Ask questions freely.** Questions never change files.
