# geeknative

**One prompt, three native apps.** geeknative is a project template and CLI that lets a coding agent build the same app natively for iOS (SwiftUI), Android (Kotlin + Jetpack Compose) and the web (React + TanStack Start), from one spec, with no cross-platform runtime.

You talk to your agent normally ("add a notes list", "make it feel warmer", "the app crashes when..."). The project's AGENTS.md teaches any agent to work out what kind of request it is, update the shared spec and contracts first, build the change in all three apps, and verify it.

```sh
npm create geeknative my-app -- --name "My App" --id com.acme.myapp
cd my-app
make doctor    # checks Xcode, the Android SDK, Java and Node; FIX=1 installs what's missing
make check     # builds and tests all three apps
```

Then open the folder in Claude Code, Codex, Cursor, Gemini CLI or any agent that reads AGENTS.md, and describe your app.

> Not on npm yet. From this repo: `node packages/geeknative/bin/geeknative.js create ../my-app --name "My App" --id com.acme.myapp`.

## How it works

The apps share no code. They stay consistent through three layers:

1. **One source of truth, read by agents.** PRODUCT.md (what and for whom), DESIGN.md (look and feel, and what adapts per platform), and spec/features/*.md (behavior, with numbered acceptance criteria).
2. **Contracts compiled into every app.** contracts/ holds the app identity, design tokens, copy and icon mappings. `make gen` turns them into Swift, Kotlin, Android resources, TypeScript and Tailwind theme code, so names, colors and strings can't drift.
3. **The same architecture, with the same names.** A feature `notes` is `NotesScreen`, `NotesViewModel` and `NotesRepository` on every platform, built with each platform's own idioms.

On top of that, AGENTS.md gives the agent:

- **Triage.** Every request is classified (product, feature, design, copy, bug, platform-specific, engineering, question) and routed to the right source of truth and playbook.
- **One loop.** Update the source of truth, regenerate, implement on each platform (in parallel where the agent supports sub-agents), verify with `make check`, record status, report.
- **Parity tracking.** Tests carry acceptance criteria IDs. `make parity` shows which criteria each platform covers.

### Stack

| | iOS | Android | Web |
|---|---|---|---|
| UI | SwiftUI | Jetpack Compose, Material 3 | React 19, Tailwind CSS v4 |
| State | `@Observable` view models | ViewModel + StateFlow | TanStack Query + view model hooks |
| Navigation | NavigationStack | Navigation 3 | TanStack Router (TanStack Start) |
| Dependencies | `AppContainer` | `AppContainer` | `AppContainer` in router context |
| Tests | Swift Testing | JUnit + coroutines-test | Vitest |
| Minimum | iOS 17 | Android 7.0 (API 24) | Safari 16.4, Chrome 111, Firefox 128 |

Each minimum is the lowest version the architecture allows: Observation on iOS, Navigation 3 on Android, Tailwind v4 on web.

There's no backend: features use repository interfaces with local implementations, so a backend can be added later without touching screens.

### Agents

- **Any agent:** AGENTS.md at the root and in each app is the canonical instruction set.
- **Claude Code:** reads AGENTS.md through one-line CLAUDE.md imports, and gets `ios-engineer`, `android-engineer` and `web-engineer` subagents for parallel work, a hook that regenerates code when contracts change, and a stop hook that flags changes made to some apps but not others.
- **Gemini CLI:** .gemini/settings.json points it at AGENTS.md.

## File ownership and upgrades

Every file in a generated project has one owner:

| Owner | Files | On upgrade |
|---|---|---|
| Framework | .geeknative/ (playbooks, templates, hooks, framework.mk), the `geeknative:begin/end` blocks in AGENTS.md and CLAUDE.md files, .claude/agents/ | Replaced |
| Project | Everything else: docs, spec, contracts, app code, your sections of AGENTS.md | Never touched |
| Generated | `Generated/`, `generated/`, `generated_*.xml`, identity files | Rebuilt by `make gen` |

`create` writes .geeknative/lock.json with the framework version and a hash of each framework-owned file, so a future `geeknative upgrade` can replace untouched files and merge edited ones.

## This repo

| Path | Contents |
|---|---|
| template/ | The project that `create` copies. It's a working project: run `make check` inside it. |
| packages/geeknative/ | The CLI and codegen (dependency-free Node). |
| packages/create-geeknative/ | `npm create geeknative` |
| scripts/smoke.js | Creates a fresh project in a temp folder and runs every check (`npm run smoke`). |

## Roadmap

1. **Foundation** (this release): three apps building from the CLI, contracts and codegen, the agent instructions, Claude Code integration, `create`, `doctor`, `check`, `parity`, `run`.
2. **Upgrades and evals:** `geeknative upgrade` with three-way merges and migrations (scripted and agent-applied); a set of real prompts run through several agents to tune AGENTS.md.
3. **Visual and end-to-end parity:** per-screen screenshots from all three apps, shared Maestro flows for iOS and Android, Playwright for web, CI.
4. **Backends:** an API contract in contracts/, generated clients, remote repositories.
