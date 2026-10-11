# Working on geeknative

This repo is the geeknative framework itself, not an app built with it.

| Path | What it is |
|---|---|
| template/ | The project every `geeknative create` copies: docs, contracts, the three apps, agent config. It's a working project you can build in place. |
| packages/geeknative/ | The CLI: `create`, `gen` (codegen), `check`, `doctor`, `parity`, `run`. Plain ESM JavaScript with `// @ts-check`, no dependencies. |
| packages/create-geeknative/ | The `npm create geeknative` entry point; forwards to `geeknative create`. |
| packages/geeknative/test/ | The CLI test suite (`npm test`, Node's built-in test runner). |
| website/ | The documentation site (Astro Starlight), deployed to GitHub Pages by .github/workflows/docs.yml. |
| scripts/smoke.js | Creates a fresh project in a temp folder and runs every check in it. |

## Rules

- **Generated code is committed in template/.** After changing a contract in template/contracts or a generator in packages/geeknative/src/codegen, run `node ../packages/geeknative/bin/geeknative.js gen` inside template/ and commit the output. Codegen output must be deterministic.
- **Know who owns each template file.** Files listed in packages/geeknative/src/lib/managed.js (and the `geeknative:begin/end` blocks in AGENTS.md and CLAUDE.md files) belong to the framework: upgrades replace them. Everything else in template/ is seeded once and then belongs to the project, so changes there only reach new projects.
- **Keep the three apps mirrored.** Template app changes follow the same rules the template's own AGENTS.md gives users: same names, same behavior, native idioms.
- **Template files named `_gitignore`** become `.gitignore` on create (npm drops real .gitignore files from packages).
- **Test** every change: `npm test` for the CLI, `cd template && make check` for the apps, and `npm run smoke` before a release. CI (.github/workflows/ci.yml) runs all three, with iOS on macOS.
- **Docs** live in website/src/content/docs. Update them in the same change as the behavior they describe.
