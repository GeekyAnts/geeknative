---
title: From idea to three apps
description: What the agent does with your first prompt in a new project, following the product playbook.
---

The first prompt in a new project usually describes the app. The agent treats it as a **Product** request and follows `.geeknative/playbooks/product.md`.

> Build a habit tracker. People create habits, check them off each day, and see their current streak.

## What the agent does

1. **Understands the product.** It restates the product in one sentence. It asks only about things that would change the data model or the navigation structure, and assumes the rest.
2. **Fills in PRODUCT.md.** The one-sentence description, the audience, the feature list, the glossary and what's out of scope. Glossary terms become the names used in code on every platform, so a "Habit" is `Habit` in Swift, Kotlin and TypeScript.
3. **Sets the design direction.** If you described a look, it writes the direction in DESIGN.md and updates `contracts/tokens.json` (colors in light and dark, type, spacing and radii), then runs `make gen`.
4. **Plans navigation.** It updates `spec/navigation.md` with the screens and how people move between them: tabs, stacks and modals. The starter Settings screen stays unless you say otherwise.
5. **Writes feature specs.** One spec per feature in `spec/features/`, from `.geeknative/templates/feature.md`, with every platform's status set to `planned`. The first version is kept small: the core loop first.
6. **Builds in vertical slices.** It takes the first feature through the whole loop on all three apps (spec, contracts, implementation, checks, status), then starts the next. It never builds every screen on one platform first.
7. **Replaces the starter content.** Once real features exist, it updates or removes Home's welcome card and updates `spec/features/home.md` to match.
8. **Reports** what it built on each platform, what's planned next, and the assumptions it made.

## Why vertical slices

Building one feature across all three platforms before starting the next keeps the apps in step at every point. If the second platform reveals a gap in the spec, only one feature needs rechecking, not a whole app.

## What to review

| File | Look for |
|---|---|
| PRODUCT.md | Is the one-sentence description right? Is anything in the feature list out of scope? |
| DESIGN.md | Does the direction match what you had in mind? |
| `spec/navigation.md` | Is the screen structure right? It's expensive to change later. |
| `spec/features/*.md` | Are the acceptance criteria what you'd test by hand? |
| `spec/decisions.md` | Do you agree with the assumptions? |
| `spec/parity.md` | Which criteria each platform's tests cover. |

Then run the apps with `make run-ios`, `make run-android` and `make run-web`, and keep going one feature at a time.
