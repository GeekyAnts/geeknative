---
title: Roadmap
description: What's planned for geeknative after 0.1.0.
---

geeknative 0.1.0 is the foundation: three apps that build and test from the command line, contracts and codegen, the agent instructions, Claude Code integration, and the `create`, `gen`, `check`, `doctor`, `parity` and `run` commands.

`geeknative upgrade` has shipped (see below). Everything else is planned, not built.

## Upgrades and agent evaluation

- **`geeknative upgrade`.** Shipped: it replaces framework files you have not changed, three-way merges the ones you have, and lists conflicts, using the hashes in `.geeknative/lock.json`. See [File ownership](/docs/concepts/file-ownership/) and [upgrade](/docs/reference/cli/#upgrade).
- **`geeknative migrate`.** Shipped as the opt-in runner: scripted migrations for mechanical project-owned changes, and agent-assisted migrations that write `.geeknative/migrations/pending/MIGRATION.md` for the user to hand to an agent (`--status` / `--complete`). `upgrade` never rewrites project-owned files; it only announces when migrations are waiting. Concrete migrations land in the registry per release (the list starts empty).
- **Agent evaluation.** A set of real prompts (a feature, a design change, a bug, a platform-only tweak) run through several agents, used to tune AGENTS.md and the playbooks wherever agents go wrong.

## Visual and end-to-end parity

- **Screenshots** of each screen from all three apps, side by side, for visual review.
- **Shared end-to-end flows** with Maestro for iOS and Android, and Playwright for the web.
- **CI for generated projects.**

## More

- **Backends.** An API contract in `contracts/`, generated clients that use the URLs in `contracts/config.json`, and repository implementations that call it.
- **More icon families** as bundled catalogs beside Lucide, and multi-color icons.
- **Italic and variable fonts**, and letter spacing in the type scale.
- **Windows** support for the Android and web apps.
