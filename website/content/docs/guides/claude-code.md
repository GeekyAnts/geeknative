---
title: Claude Code
description: How a geeknative project integrates with Claude Code, through instruction imports, platform subagents, hooks and permissions.
---

Every agent follows the same AGENTS.md files. Claude Code also gets a thin extra layer in `CLAUDE.md` and `.claude/`.

## Instructions

The project has one-line `CLAUDE.md` files next to each `AGENTS.md` (at the root and in `apps/ios`, `apps/android` and `apps/web`) that import it:

```md
@AGENTS.md
```

Recent versions of Claude Code read AGENTS.md on their own, but only when the project has no CLAUDE.md. The import keeps the instructions loading either way, including when a developer has a personal `CLAUDE.local.md`. The per-app files load when Claude starts working on files in that app.

The root CLAUDE.md also has a Claude-specific section, managed by geeknative:

- When a change touches more than one app, Claude hands the platform work to three subagents in parallel and stays the lead. Each brief is the feature id, the spec path, the acceptance criteria IDs and what changed in `contracts/`. The lead owns `spec/`, `contracts/`, PRODUCT.md and DESIGN.md, and runs `make check` once after the platform agents finish.
- A hook regenerates code whenever a file in `contracts/` is edited.
- A stop hook reminds Claude once if a turn changed some apps but not the others.

## Platform subagents

`.claude/agents/` defines three subagents:

| Subagent | Works in | Verifies with |
|---|---|---|
| `ios-engineer` | `apps/ios/` | `geeknative check ios --feature <id>` |
| `android-engineer` | `apps/android/` | `geeknative check android --feature <id>` |
| `web-engineer` | `apps/web/` | `geeknative check web --feature <id>` |

Each one gets a brief from the lead (the feature id, the spec path, the acceptance criteria IDs and what changed in `contracts/`) and:

1. runs `geeknative context <id> --platform <platform>` and reads the spec, the one reference folder and the listed files;
2. implements from the spec, without porting code from the other apps or searching the repo;
3. edits only its own app, never `spec/`, `contracts/`, PRODUCT.md, DESIGN.md or generated files, and reports spec gaps instead of guessing;
4. names tests after acceptance criteria;
5. runs the targeted check, reads `.geeknative/logs/<platform>.json` on failure, and stops when it passes;
6. reports file paths, the criteria its tests cover, and the check status, without pasting source or logs.

## Hooks

`.claude/settings.json` registers three hooks. The scripts live in `.geeknative/hooks/` and run with Node.

| Event | Script | What it does |
|---|---|---|
| `PostToolUse` on Edit, Write and MultiEdit | `after-edit.mjs` | If the edited file is in `contracts/`, runs `geeknative gen` right away. If the contract is invalid, it reports the error to Claude so it can fix the contract. |
| `SubagentStart` for each platform subagent | `subagent-context.mjs <platform>` | Adds that platform's `apps/<platform>/AGENTS.md` to the subagent's context when it starts, and tells it not to read the other apps, generated output or check logs. |
| `Stop` | `parity-guard.mjs` | If the uncommitted changes touch some apps but not the others, it asks Claude once to finish the other apps or explain why the change is platform-specific. |

The stop hook ignores generated files and agent docs, and remembers the set of changes it already flagged (in `.git/geeknative-parity-guard`), so it reminds once and then lets Claude finish. It does nothing outside a git repository or before the first commit.

## Permissions

`.claude/settings.json` allows the commands Claude needs for its build and test loop without asking each time:

```json
"allow": [
  "Bash(make *)",
  "Bash(npx geeknative *)",
  "Bash(./node_modules/.bin/geeknative *)",
  "Bash(npm run *)",
  "Bash(xcodebuild *)",
  "Bash(xcrun simctl *)",
  "Bash(./gradlew *)"
]
```

Claude Code applies project permissions after you accept the workspace trust prompt for the folder. Your own permissions go in `.claude/settings.local.json`.

## Tips

- Start Claude Code in the project root. Claude Code loads the project's instructions, hooks and platform subagents from the folder the session starts in, so a session started in a parent folder or another repo runs without them, and nothing warns you. `make check` enforces the same rules as the hooks (generated code is current, specs and parity are up to date, see [lint](/docs/reference/cli/#lint)), so run it before you call a change done either way.
- A good first prompt describes the whole app. See [From idea to three apps](/docs/guides/idea-to-three-apps/).
- If the stop hook flags a change you meant for one platform only, tell Claude so; it records the difference in the spec's Platform notes.
