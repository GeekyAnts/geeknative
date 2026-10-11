---
title: File ownership
description: Which files in a project belong to you, which belong to the framework, and which are generated.
---

Every file in a geeknative project has one owner. That's what makes framework upgrades possible without touching your work.

| Owner | Files | On upgrade |
|---|---|---|
| **Framework** | `.geeknative/framework.mk`, `.geeknative/playbooks/`, `.geeknative/templates/`, `.geeknative/hooks/`, `.claude/agents/ios-engineer.md`, `android-engineer.md` and `web-engineer.md`, and the managed block in each `AGENTS.md` and the root `CLAUDE.md` | Replaced |
| **You** | Everything else: PRODUCT.md, DESIGN.md, `spec/`, `contracts/`, all app code, your sections of `AGENTS.md`, the Makefile, `.claude/settings.json` | Never touched |
| **Generated** | `Generated/`, `generated/`, `generated_*.xml`, `Identity.xcconfig`, `identity.properties` | Rebuilt by `make gen` |

## Managed blocks

AGENTS.md files mix framework rules and your rules. The framework's part sits between markers:

```md
<!-- geeknative:begin (managed by geeknative: replaced on upgrade. Add your own rules under "Project rules" at the end.) -->
# How to work in this repo
...
<!-- geeknative:end -->

## Project rules

- Brand voice is playful.
- No bottom sheets on iOS.
```

Put your own rules under "Project rules". They override the framework defaults above them.

The same applies to `apps/ios/AGENTS.md`, `apps/android/AGENTS.md`, `apps/web/AGENTS.md` and the Claude Code section of the root `CLAUDE.md`.

## The lockfile

`geeknative create` writes `.geeknative/lock.json` with the framework version and a SHA-256 hash of every framework-owned file and block, as installed:

```json
{
  "geeknative": "0.1.0",
  "files": {
    ".claude/agents/android-engineer.md": "sha256-3a8f...",
    ".geeknative/framework.mk": "sha256-fc52...",
    "...": "..."
  },
  "blocks": {
    "AGENTS.md": "sha256-...",
    "...": "..."
  }
}
```

## Upgrades

`geeknative upgrade` is planned, not built yet; see the [roadmap](/docs/project/roadmap/). The lockfile is what will make it safe:

- framework files you never touched (their hash still matches) get replaced;
- framework files you edited get a three-way merge with the new version, with conflicts listed;
- your files are never touched, except by explicit migrations;
- generated files are rebuilt by `make gen`.

Because `create` already writes the lockfile, projects created today can be upgraded when the command ships.

## Generated files

Never edit generated files. Change the contract in `contracts/` and run `make gen`. `make check` fails if generated files are out of date:

```text
✖ contracts  Generated files are out of date:
  apps/web/src/generated/strings.ts
Run `make gen`, and never edit generated files by hand.
```
