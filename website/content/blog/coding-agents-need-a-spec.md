---
title: Why your coding agent needs a spec
label: Coding agents need a spec
date: 2026-11-05
order: 4
description: Coding agents write code fast and drift just as fast. A spec-first loop in AGENTS.md, with contracts and checks, keeps their work consistent. Here is the pattern geeknative uses.
---

A coding agent will happily do what you ask. Ask it for a notes list on iOS and it writes one. Ask again for Android a week later and you get a slightly different notes list. The names differ, the empty state differs, the copy differs. Nothing is wrong, exactly. It's just not the same product.

The fix is not a better prompt. It is a place for decisions to live that isn't the code.

## Decisions belong in files

In a geeknative project, every kind of decision has a home:

| Decision | Where it lives |
|---|---|
| What the app is and for whom | PRODUCT.md |
| How it looks, and what adapts per platform | DESIGN.md and `contracts/tokens.json` |
| Screens and how people move between them | `spec/navigation.md` |
| What a feature does, testably | `spec/features/<id>.md` |
| Names, copy and icons | `contracts/strings/` and `contracts/icons.json` |
| Decisions and assumptions, dated | `spec/decisions.md` |

The agent reads these before it writes code, and updates them before it changes behavior. A later request, on any platform, starts from the same decisions.

## Triage first

Not every request is the same kind of work. AGENTS.md has the agent classify each one before acting: product, feature, design, copy, bug, platform-specific, engineering or a question. The main types have a playbook in `.geeknative/playbooks/` that says which files change first.

"Make it feel warmer" is a design request, so DESIGN.md and the tokens change, not individual screens. "Change the button label" is copy, so `contracts/strings/` changes, and every app picks it up from `make gen`. This one step removes most drift.

## Contracts the compiler enforces

Some decisions are too important to leave to reading. App identity, design tokens, strings and icons are JSON contracts compiled into code for each platform. If a contract is invalid, `make gen` fails with the file and field. If generated files are out of date, `make check` fails. The agent can't quietly hard-code a color or a string that drifts.

## A definition of done

The last piece is verification. A change is done when:

1. the source of truth is updated;
2. every affected app builds and passes `make check`;
3. tests name the acceptance criteria they cover;
4. each platform's status is recorded in the spec;
5. the agent reports one line per platform.

## Works with any agent

All of this is plain files: Markdown instructions, JSON contracts, a Makefile and a small CLI. It follows the AGENTS.md convention, so Claude Code, Codex, Cursor, Gemini CLI and the GitHub Copilot coding agent all pick it up. Nothing is installed into the agent.

Even if you never build a three-platform app, the pattern is worth borrowing: give decisions a home, triage before acting, enforce what matters, and define done. You can read the full instructions in [Working with your agent](/docs/guides/working-with-your-agent/) and [How it works](/docs/concepts/how-it-works/).
