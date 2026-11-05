---
title: How to build an iOS, Android and web app with Claude Code
label: Build with Claude Code
date: 2026-11-05
order: 2
description: A walkthrough of building one app natively in SwiftUI, Jetpack Compose and React with Claude Code and geeknative, from the first prompt to verified builds on every platform.
---

Claude Code can write a SwiftUI app. It can also write a Compose app and a React app. The hard part is getting it to write the same app three times, and keep doing so as the product changes. This post walks through how a geeknative project sets that up.

## 1. Create the project

```sh
npm create geeknative@latest habits -- --name "Habits" --id com.acme.habits
cd habits
make doctor
```

`make doctor` checks Node, the contracts, Xcode and an iPhone simulator, Java and the Android SDK. `make doctor FIX=1` installs what it safely can. Then build and test the starter app on all three platforms:

```sh
make check
```

The starter has two screens, Home and Settings, built the same way on iOS, Android and the web. They are the pattern new features follow.

## 2. Open it in Claude Code

Start Claude Code in the project root. The root CLAUDE.md is one line, `@AGENTS.md`, so Claude loads the same instructions every agent follows. Each app folder has its own AGENTS.md and CLAUDE.md, which load when Claude works on files there.

Claude Code also gets a few extras in `.claude/`:

- Three subagents: `ios-engineer`, `android-engineer` and `web-engineer`.
- A hook that runs `geeknative gen` whenever a file in `contracts/` changes.
- A stop hook that asks once if a turn changed some apps but not the others.

## 3. Describe the whole app

The first prompt should describe the product:

> Build a habit tracker. People create habits, check them off each day, and see their current streak.

Claude treats this as a product request and follows the product playbook. It fills in PRODUCT.md, sets the design direction, plans the screens in `spec/navigation.md`, and writes one spec per feature, each with numbered acceptance criteria like `AC-habits-1`.

## 4. Watch the three apps get built

For each feature, Claude stays the lead. It owns the spec and the contracts, and hands the platform work to the three subagents in parallel. Each subagent:

1. reads the spec and follows the Settings feature as the pattern;
2. implements from the spec, without porting code from the other apps;
3. names its tests after the acceptance criteria;
4. runs its platform's check (`make check-ios`, `make check-android` or `make check-web`) until it passes;
5. reports the files it changed and the criteria it covered.

Features are built in vertical slices. The first feature goes through all three apps before the next one starts, so the apps stay in step at every point.

## 5. Review the spec, not three codebases

You can read every diff, but the fastest review is the source of truth:

| File | Look for |
|---|---|
| PRODUCT.md | Is the description right? Is anything out of scope? |
| `spec/navigation.md` | Is the screen structure right? |
| `spec/features/*.md` | Are the acceptance criteria what you'd test by hand? |
| `spec/parity.md` | Which criteria each platform's tests cover |

Run the apps with `make run-ios`, `make run-android` and `make run-web`.

## 6. Keep talking normally

From here, you prompt the way you would in any project. "Make it feel warmer, with rounder corners" is a design request: Claude updates DESIGN.md and `contracts/tokens.json`, and the hook regenerates code for every app. "Add reminders" is a feature request: a new spec, then three implementations. "The streak resets at the wrong time on Android" is a bug: Claude checks whether the spec covered the case, fixes the spec if it didn't, fixes every app that doesn't match, and adds a regression test named after the criterion.

## Not using Claude Code?

The same project works with Codex, Cursor, Gemini CLI, the GitHub Copilot coding agent and any agent that reads AGENTS.md. Claude Code just gets the subagents and hooks on top. See [Other agents](/docs/guides/other-agents/) and the [Claude Code guide](/docs/guides/claude-code/).
