---
title: CLI
description: Every geeknative command and option, and the make targets that wrap them.
---

The `geeknative` CLI is a dev dependency of every project. Inside a project you normally use it through `make`. Run it directly with `npx geeknative <command>`.

```text
geeknative <command>

  create <folder>      Create a project. Options: --name "My App" --id com.acme.myapp --no-install --no-git
  gen                  Regenerate platform code from contracts/
  font <family>        Switch the shared typeface: a Google Fonts family ("Open Sans") or system
  check [targets]      Verify contracts, then build and test. Targets: all (default), contracts, ios, android, web
  doctor [--fix]       Check Xcode, the Android SDK and Node; --fix installs what it can
  parity               Update spec/parity.md from feature specs and tests
  run <platform>       Build and launch: ios (simulator), android (emulator or device), web (dev server)
  version              Print the version
```

`geeknative help` (or `-h`) prints this list, and `-v` prints the version. Every command except `create` and `version` works from anywhere inside a project: it walks up from the current folder to the one containing `contracts/app.json`.

## create

```sh
npm create geeknative@latest <folder> -- [--name "My App"] [--id com.acme.myapp] [--no-install] [--no-git]
npx geeknative@latest create <folder> [options]
```

| Option | Default | Description |
|---|---|---|
| `--name` | The folder name in title case (`my-app` becomes "My App") | The app's display name |
| `--id` | `com.example.<folder name without dashes>` | Bundle ID on iOS, application ID on Android |
| `--no-install` | | Skip `npm install` |
| `--no-git` | | Skip `git init` and the first commit |
| `--link` | | Only when running from a geeknative checkout: depend on the checkout itself instead of a snapshot of it (see below) |

`create`:

1. checks that the folder doesn't exist or is empty, and that the name and ID are valid on every platform;
2. copies the template;
3. writes the name and ID to `contracts/app.json` and the folder name to `package.json`;
4. runs `gen` and writes `.geeknative/lock.json`;
5. writes `apps/android/local.properties` if it finds an Android SDK;
6. runs `npm install`, then `git init` and a first commit (unless you passed `--no-install` or `--no-git`).

A project created from npm depends on `geeknative` at `^<version>`. A project created from a git checkout of geeknative (`node packages/geeknative/bin/geeknative.js create ...`) is pinned to a snapshot of that checkout: `create` packs it into `.geeknative/geeknative-<version>-<commit>.tgz` (with `-dirty` if the checkout had uncommitted changes) and depends on that file, so switching the checkout to another branch never changes the project. Commit the tarball with the project. With `--link`, the project depends on the checkout folder instead and follows whatever branch is checked out there, which is useful only while working on geeknative itself.

## gen

```sh
npx geeknative gen        # or: make gen
```

Validates every contract, writes the generated files that changed, and deletes generated files that are no longer produced (for example, after removing a locale). It lists the files it changed. Invalid contracts fail with a message naming the file and field. See [Contracts](/docs/reference/contracts/).

Files built from `.env` (`AppSecrets.swift` and `AppSecrets.kt`) are always written, even by `check`, and are never compared, because they are not committed. If `.env` lacks a declared key, `gen` prints a warning.

## font

```sh
npx geeknative font "Open Sans"   # or: make font FAMILY="Open Sans"
npx geeknative font system        # or: make font FAMILY=system
```

Switches the typeface of all three apps. For a Google Fonts family it downloads one TrueType file per weight the type scale uses into `contracts/fonts/`, checks that each file really is that family and weight, fetches the license text next to them, rewrites the `font` block of `contracts/tokens.json` (and nothing else in the file), removes the previous family's files, and runs `gen`. `system` removes the files and goes back to each platform's own font.

Any family on [Google Fonts](https://fonts.google.com) works; a name it doesn't have fails with a message. For a font that isn't there, copy its `.ttf` or `.otf` files into `contracts/fonts/` and list them under `font.files` yourself. See [Contracts](/docs/reference/contracts/#tokensjson).

## check

```sh
npx geeknative check [all | contracts | ios | android | web ...]   # or: make check, make check-ios, ...
```

Always validates the contracts first and fails if generated files are out of date. Then it runs [`lint`](#lint): for every app with a full `check`, with the spec rules too, or only for the app you name (`check ios`). Then it builds and tests each requested app. While iOS and Android build, it prints each phase as it starts (compiling, linking, running tests) and a line every 30 seconds with the time so far, then one result line per app. Full output goes to `.geeknative/logs/<platform>.log`; on failure, the most relevant lines are printed (up to 25). The exit code is 1 if anything failed.

| Target | What runs |
|---|---|
| `ios` | `xcodebuild test` for the `App` scheme on an iPhone simulator, with derived data in `apps/ios/.build/` and parallel testing off, so it runs on the simulator itself instead of booting a copy. macOS only. |
| `android` | `./gradlew :app:testDebugUnitTest :app:assembleDebug` in `apps/android`. Writes `local.properties` if it's missing. |
| `web` | `npm run check` in `apps/web`: route generation and `tsc`, then Vitest, then a production build. Needs `npm install` first. |
| `contracts` | Only the contract validation. |

To build another environment, set `GEEKNATIVE_ENV` (or pass `ENV=staging` to `make`). iOS gets `APP_ENVIRONMENT=<name>`, Android gets `-PappEnvironment=<name>`, and the web build gets `VITE_APP_ENVIRONMENT=<name>`. A name `config.json` doesn't declare is an error. The web build also gets the values in `.env`, so server code can read `process.env`.

The simulator is the one named in `GEEKNATIVE_IOS_SIMULATOR` (a name or UDID) if set, otherwise an iPhone on the newest installed iOS runtime, preferring one that's already booted. An older booted simulator is never picked on its own, so every run uses the same iOS version.

## doctor

```sh
npx geeknative doctor [--fix]   # or: make doctor, make doctor FIX=1
```

| Check | Passes when | `--fix` |
|---|---|---|
| node | Node 22 or later | |
| deps | `node_modules/` exists | Runs `npm install` |
| geeknative | Says where the CLI comes from: npm, a pinned snapshot, or a checkout. A live link to a checkout is a warning, naming the branch and commit it's on now. | Pins the project to a snapshot of that checkout and runs `npm install` |
| contracts | Contracts are valid and generated files are current | |
| xcode | Xcode 26 or later (macOS only) | |
| simulator | An iPhone simulator is available | |
| java | A JDK can start Gradle | |
| android | An Android SDK is found (and `local.properties` is written) | |
| secrets | Every secret in `contracts/config.json` has a value in `.env`. This is a warning, not a failure, and is skipped when none are declared. | Copies `.env.example` to `.env` if there is no `.env` |
| platform | The Android API level the app compiles against (37) is installed | Accepts the SDK licenses and installs it with `sdkmanager` |

It ends with the number of problems found and exits with 1 if there were any.

## parity

```sh
npx geeknative parity   # or: make parity
```

Writes `spec/parity.md` from the feature specs and the tests, and prints each feature's status and untested criteria. See [Specs and parity](/docs/concepts/specs-and-parity/).

## lint

```sh
npx geeknative lint [ios | android | web ...]   # or: make lint (make check runs it too)
```

With no arguments it checks every app's code and the specs. Name apps to check only their code, as `make check-<platform>` does.

Finds what builds and tests can't: places where the code breaks a rule from AGENTS.md or DESIGN.md, and spec bookkeeping nobody updated. Errors make the exit code 1.

| Rule | Level | Finds |
|---|---|---|
| `text` | Error | User-facing text written in code instead of `contracts/strings`: `Text("Total")`, `Button("…")`, `.navigationTitle("…")` and `.accessibilityLabel("…")` on iOS; `Text("…")` and `contentDescription = "…"` on Android; text between JSX tags, string children and `aria-label`, `placeholder`, `title` and `alt` attributes on the web. Text composed around values counts too (`"\(name) × \(count)"`); a value alone (`"\(count)"`) and emoji don't. |
| `test-id` | Error | A test ID in app code that no spec lists in its "Test IDs" section: set directly (`accessibilityIdentifier`, `testTag`, `data-testid`) or passed to a helper (`testID:` on iOS, `testTag =` on Android, `testId=` on the web). `<placeholder>` parts of a listed ID match any value. |
| `test-id` | Warning | A listed test ID that an app whose status is `done` never uses |
| `title` | Error | A centered screen title: `.navigationBarTitleDisplayMode(.inline)` on iOS, `CenterAlignedTopAppBar` on Android. Titles are leading-aligned on every platform. |
| `status` | Error | A platform still `planned` although its tests name the feature's criteria. A warning for `in-progress` with every criterion covered. Fixed in `spec/` by whoever owns the specs. |
| `parity` | Error | `spec/parity.md` doesn't match the specs and tests. Run `make parity`. |
| `platforms` | Warning | Uncommitted changes touch some apps but not the others, the same reminder the Claude Code stop hook gives |

It skips generated code, tests, and the body of each iOS `#Preview` block and Android `@Preview` function (code around them is still checked). The web text rules look at `.tsx` files only. To keep a line on purpose (a sheet with the system's inline title, say), add a comment containing `geeknative-ignore` to it or to the line above.

## run

```sh
npx geeknative run ios | android | web   # or: make run-ios, make run-android, make run-web
```

| Platform | What happens |
|---|---|
| `ios` | Boots the chosen simulator if needed, opens Simulator, builds, installs and launches the app by its bundle ID. |
| `android` | Uses a connected device or running emulator. If there's none, it starts the first emulator from `emulator -list-avds` and waits for it to boot. Then `./gradlew :app:installDebug` and launches `app.MainActivity`. |
| `web` | Starts the TanStack Start dev server at `http://localhost:3000`, with the values in `.env` available to server code. |

`run` runs `gen` first, so a launch never uses stale generated code or an old `.env`. It takes `GEEKNATIVE_ENV` the same way `check` does.

## make targets

The project's Makefile includes `.geeknative/framework.mk`:

| Target | Runs |
|---|---|
| `make` or `make help` | Lists the targets |
| `make doctor` | `geeknative doctor` (`FIX=1` adds `--fix`) |
| `make gen` | `geeknative gen` |
| `make font FAMILY="Open Sans"` | `geeknative font "Open Sans"` |
| `make check` | `geeknative check all` |
| `make check-contracts` | `geeknative check contracts` |
| `make check-ios`, `check-android`, `check-web` | `geeknative check <platform>` |
| `make parity` | `geeknative parity` |
| `make lint` | `geeknative lint` |
| `make run-ios`, `run-android`, `run-web` | `geeknative run <platform>` |

Add `ENV=<name>` to a `check` or `run` target to set `GEEKNATIVE_ENV` for it, for example `make check-ios ENV=staging`.

Add your own targets to the root Makefile, below the `include` line.

## Environment variables

| Variable | Effect |
|---|---|
| `GEEKNATIVE_ENV` | The environment `check` and `run` build: a name from `contracts/config.json`. Unset, debug builds use `development`. |
| `GEEKNATIVE_IOS_SIMULATOR` | The simulator to build, test and run on (name or UDID) |
| `NO_COLOR` | Turns off colored output |
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Where to find the Android SDK |
