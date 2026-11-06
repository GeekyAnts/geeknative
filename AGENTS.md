# Working on geeknative

This repo is the geeknative framework itself, not an app built with it.

| Path | What it is |
|---|---|
| template/ | The project every `geeknative create` copies: docs, contracts, the three apps, agent config. It's a working project you can build in place. |
| packages/geeknative/ | The CLI: `create`, `gen` (codegen), `check`, `doctor`, `parity`, `run`. Plain ESM JavaScript with `// @ts-check`, no dependencies. |
| packages/create-geeknative/ | The `npm create geeknative` entry point; forwards to `geeknative create`. |
| packages/geeknative/test/ | The CLI test suite (`npm test`, Node's built-in test runner). |
| website/ | The landing page and docs (Next.js static export, styled after colony.geekyants.com), deployed to GitHub Pages by .github/workflows/docs.yml. |
| demo-apps/ | Finished sample apps (this branch). Each one has a `previews/` folder of real screenshots. |
| scripts/smoke.js | Creates a fresh project in a temp folder and runs every check in it. |
| scripts/publish-demo-app.mjs | Copies an app into `demo-apps/<slug>/` and photographs every screen on iOS, Android and web. |

## Rules

- **Generated code is committed in template/.** After changing a contract in template/contracts or a generator in packages/geeknative/src/codegen, run `node ../packages/geeknative/bin/geeknative.js gen` inside template/ and commit the output. Codegen output must be deterministic.
- **Know who owns each template file.** Files listed in packages/geeknative/src/lib/managed.js (and the `geeknative:begin/end` blocks in AGENTS.md and CLAUDE.md files) belong to the framework: upgrades replace them. Everything else in template/ is seeded once and then belongs to the project, so changes there only reach new projects.
- **Keep the three apps mirrored.** Template app changes follow the same rules the template's own AGENTS.md gives users: same names, same behavior, native idioms.
- **Template files named `_gitignore`** become `.gitignore` on create (npm drops real .gitignore files from packages).
- **Test** every change: `npm test` for the CLI, `cd template && make check` for the apps, and `npm run smoke` before a release. CI (.github/workflows/ci.yml) runs all three, with iOS on macOS.
- **Docs** live in website/content/docs. Update them in the same change as the behavior they describe.
- **Demo apps are not copied in by hand.** Adding or updating an app in `demo-apps/` includes taking its screenshots in the same turn. Follow **Publishing a demo app** below. Do not stop after the source lands in `demo-apps/<slug>/`.

## Publishing a demo app

The screenshots in `demo-apps/<slug>/previews/` are part of the app. An app without them is not finished.

1. Teach the app to open a named screen, the way dine-in does: iOS launch arguments `-screenshotScreen` and `-screenshotAppearance` (see `apps/ios/App/Core/UITesting.swift`), Android intent extras of the same names (see `apps/android/.../ScreenshotLaunch.kt`). Seed the same sample member, reservations and saved items the shots will show.
2. Write `previews/shots.json`: every screen and tab from `spec/navigation.md`, with real sample ids (no `$placeholders` in `webPath`). Copy dine-in's file and edit it.
3. Publish from the repo root, on a Mac with Xcode and an Android emulator:

```sh
node scripts/publish-demo-app.mjs /path/to/app slug-name
```

If the app is already in `demo-apps/<slug>/`:

```sh
node scripts/publish-demo-app.mjs --capture slug-name
```

4. If the script writes a stub `shots.json` and exits, fill in the sample ids and run `--capture` again.
5. Commit `previews/shots.json` and the webp files under `previews/ios/`, `previews/android/` and `previews/web/` with the app.

Do not copy `node_modules`, Gradle or DerivedData into `demo-apps/`. The publish script skips those. Do not capture on Ubuntu CI: it needs simulators.
