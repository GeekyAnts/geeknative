---
title: CLI
description: Every geeknative command and option, and the make targets that wrap them.
---

The `geeknative` CLI is a dev dependency of every project. Inside a project you normally use it through `make`. Run it directly with `npx geeknative <command>`.

```text
geeknative <command>

  create <folder>      Create a project. Options: --name "My App" --id com.acme.myapp --no-install --no-git
  gen                  Regenerate platform code from contracts/
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

`create`:

1. checks that the folder doesn't exist or is empty, and that the name and ID are valid on every platform;
2. copies the template;
3. writes the name and ID to `contracts/app.json` and the folder name to `package.json`;
4. runs `gen` and writes `.geeknative/lock.json`;
5. writes `apps/android/local.properties` if it finds an Android SDK;
6. runs `npm install`, then `git init` and a first commit (unless you passed `--no-install` or `--no-git`).

## gen

```sh
npx geeknative gen        # or: make gen
```

Validates every contract, writes the generated files that changed, and deletes generated files that are no longer produced (for example, after removing a locale). It lists the files it changed. Invalid contracts fail with a message naming the file and field. See [Contracts](/docs/reference/contracts/).

Files built from `.env` (`AppSecrets.swift` and `AppSecrets.kt`) are always written, even by `check`, and are never compared, because they are not committed. If `.env` lacks a declared key, `gen` prints a warning.

## check

```sh
npx geeknative check [all | contracts | ios | android | web ...]   # or: make check, make check-ios, ...
```

Always validates the contracts first and fails if generated files are out of date. Then it builds and tests each requested app and prints one line per app. Full output goes to `.geeknative/logs/<platform>.log`; on failure, the most relevant lines are printed (up to 25). The exit code is 1 if anything failed.

| Target | What runs |
|---|---|
| `ios` | `xcodebuild test` for the `App` scheme on an iPhone simulator, with derived data in `apps/ios/.build/`. macOS only. |
| `android` | `./gradlew :app:testDebugUnitTest :app:assembleDebug` in `apps/android`. Writes `local.properties` if it's missing. |
| `web` | `npm run check` in `apps/web`: route generation and `tsc`, then Vitest, then a production build. Needs `npm install` first. |
| `contracts` | Only the contract validation. |

The simulator is the one named in `GEEKNATIVE_IOS_SIMULATOR` (a name or UDID) if set, otherwise a booted iPhone, otherwise an iPhone on the newest iOS runtime.

## doctor

```sh
npx geeknative doctor [--fix]   # or: make doctor, make doctor FIX=1
```

| Check | Passes when | `--fix` |
|---|---|---|
| node | Node 22 or later | |
| deps | `node_modules/` exists | Runs `npm install` |
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

## run

```sh
npx geeknative run ios | android | web   # or: make run-ios, make run-android, make run-web
```

| Platform | What happens |
|---|---|
| `ios` | Boots the chosen simulator if needed, opens Simulator, builds, installs and launches the app by its bundle ID. |
| `android` | Uses a connected device or running emulator. If there's none, it starts the first emulator from `emulator -list-avds` and waits for it to boot. Then `./gradlew :app:installDebug` and launches `app.MainActivity`. |
| `web` | Starts the TanStack Start dev server at `http://localhost:3000`. |

## make targets

The project's Makefile includes `.geeknative/framework.mk`:

| Target | Runs |
|---|---|
| `make` or `make help` | Lists the targets |
| `make doctor` | `geeknative doctor` (`FIX=1` adds `--fix`) |
| `make gen` | `geeknative gen` |
| `make check` | `geeknative check all` |
| `make check-contracts` | `geeknative check contracts` |
| `make check-ios`, `check-android`, `check-web` | `geeknative check <platform>` |
| `make parity` | `geeknative parity` |
| `make run-ios`, `run-android`, `run-web` | `geeknative run <platform>` |

Add your own targets to the root Makefile, below the `include` line.

## Environment variables

| Variable | Effect |
|---|---|
| `GEEKNATIVE_IOS_SIMULATOR` | The simulator to build, test and run on (name or UDID) |
| `NO_COLOR` | Turns off colored output |
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Where to find the Android SDK |
