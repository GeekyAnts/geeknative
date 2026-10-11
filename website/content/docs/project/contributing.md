---
title: Contributing
description: How the geeknative repository is organized, and how to change and test it.
---

geeknative is open source under the Apache 2.0 license, at [github.com/GeekyAnts/geeknative](https://github.com/GeekyAnts/geeknative).

## Repository layout

| Path | What it is |
|---|---|
| `template/` | The project every `geeknative create` copies: docs, contracts, the three apps and the agent config. It's a working project you can build in place. |
| `packages/geeknative/` | The CLI: `create`, `gen` (codegen), `check`, `doctor`, `parity` and `run`. Plain ESM JavaScript with `// @ts-check` and no dependencies. |
| `packages/geeknative/test/` | The CLI test suite. |
| `packages/create-geeknative/` | The `npm create geeknative` entry point. It forwards to `geeknative create`. |
| `scripts/smoke.js` | Creates a fresh project in a temp folder and runs every check in it. |
| `website/` | This site: the landing page and docs, a static Next.js export styled after colony.geekyants.com. |

## Working on the template

`template/` is a real project. Build it in place:

```sh
cd template
npm install
make check
```

Generated code is committed in `template/`. After changing a contract in `template/contracts/` or a generator in `packages/geeknative/src/codegen/`, regenerate and commit the output:

```sh
cd template
node ../packages/geeknative/bin/geeknative.js gen
```

Codegen output must be deterministic.

Some template files belong to the framework (the files listed in `packages/geeknative/src/lib/managed.js`, and the `geeknative:begin` and `geeknative:end` blocks in AGENTS.md and CLAUDE.md files). Upgrades will replace them in existing projects. Everything else in `template/` is copied once at create time and then belongs to the project, so changes there only reach new projects.

Template files named `_gitignore` become `.gitignore` when a project is created, because npm drops real `.gitignore` files from published packages.

## Tests

| Command | What it covers |
|---|---|
| `npm test` | The CLI test suite, with Node's built-in test runner |
| `cd template && make check` | The three template apps: iOS, Android and web |
| `npm run smoke` | A freshly created project, end to end |

CI (`.github/workflows/ci.yml`) runs on every push and pull request: the CLI test suite, a smoke test that creates a project and checks its contracts and web app, and the template's web and Android checks on Ubuntu and iOS checks on macOS. `.github/workflows/docs.yml` builds this site and deploys it to GitHub Pages.

## Documentation

The docs live in `website/content/docs/` as Markdown. Update them in the same change as the behavior they describe.

```sh
cd website
npm install
npm run dev
```

`npm run build` exports the site to `out/` and indexes it for search; `npm run check-links` then fails on any broken internal link.

## Releasing

Bump the version in `packages/geeknative/package.json` and `packages/create-geeknative/package.json` (including its `geeknative` dependency). Publish `geeknative` first, then `create-geeknative`. Publishing bundles `template/` into the `geeknative` package automatically.
