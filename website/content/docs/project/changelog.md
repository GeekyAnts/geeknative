---
title: Changelog
description: Release notes for geeknative.
---

## 0.1.0 (2026-10-10)

The first release.

- **CLI:** `create`, `gen`, `check`, `doctor`, `parity` and `run`, published as `geeknative` with `npm create geeknative` (`create-geeknative`).
- **Template:**
  - AGENTS.md that triages plain prompts and routes them to PRODUCT.md, DESIGN.md, specs or contracts, plus one AGENTS.md per app and playbooks for each request type.
  - Three apps with matching Home and Settings screens: SwiftUI (iOS 17 and later), Kotlin and Jetpack Compose (Android 7.0 and later), and React on TanStack Start.
  - Contracts for app identity, design tokens, strings (with placeholders, plurals and locales) and icons, compiled into every app.
  - Feature specs with acceptance criteria IDs, and parity reporting.
- **Agents:** CLAUDE.md imports, `ios-engineer`, `android-engineer` and `web-engineer` subagents, and hooks for Claude Code; a Gemini CLI setting; Dependabot configuration.
- **Ownership:** a lockfile recording framework file hashes, ready for future upgrades.
- **License:** Apache 2.0.
