---
title: Other agents
description: Using a geeknative project with Codex, Cursor, GitHub Copilot, Gemini CLI and other coding agents.
---

geeknative's instructions are plain markdown in `AGENTS.md` files, the format most coding agents read. Nothing in them depends on a particular agent.

## Agents that read AGENTS.md

Codex, Cursor, the GitHub Copilot coding agent and many others read `AGENTS.md` at the project root. Open the project folder and prompt as usual.

Each app also has its own `AGENTS.md` with its conventions:

| File | Covers |
|---|---|
| `apps/ios/AGENTS.md` | SwiftUI patterns, the Xcode project, iOS commands |
| `apps/android/AGENTS.md` | Compose patterns, Gradle, Android commands |
| `apps/web/AGENTS.md` | React and TanStack patterns, web commands |

Some agents load nested AGENTS.md files on their own and some don't, so the root file also tells the agent to read `apps/<platform>/AGENTS.md` before editing in that folder.

## Gemini CLI

Gemini CLI reads `GEMINI.md` by default. The project's `.gemini/settings.json` points it at AGENTS.md instead:

```json
{
  "context": {
    "fileName": ["AGENTS.md"]
  }
}
```

## Agents without sub-agents

The loop in AGENTS.md works with or without sub-agents. If your agent can run sub-agents in parallel, it gives each platform its own. Otherwise it does the platforms one after another. Either way, the request isn't done until all three apps do it (or the spec marks the difference).

## What's Claude-specific

The hooks and subagents in `.claude/` only run in Claude Code. With other agents:

- AGENTS.md tells the agent to run `make gen` after editing `contracts/`. The [Claude Code](/geeknative/guides/claude-code/) hook does that automatically.
- The parity reminder doesn't run, but `make parity` and the agent's per-platform report show the same information.
