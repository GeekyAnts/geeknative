---
title: Roadmap
description: What's planned for geeknative after 0.1.0.
---

geeknative 0.1.0 is the foundation: three apps that build and test from the command line, contracts and codegen, the agent instructions, Claude Code integration, and the `create`, `gen`, `check`, `doctor`, `parity` and `run` commands.

Everything below is planned, not built.

## Upgrades and agent evaluation

- **`geeknative upgrade`.** Replace framework files that you haven't changed, three-way merge the ones you have, and list conflicts, using the hashes in `.geeknative/lock.json`. See [File ownership](/docs/concepts/file-ownership/).
- **Migrations.** Scripted migrations for mechanical changes (such as a new spec format), and written migrations an agent applies across all three apps for changes that need judgment.
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
