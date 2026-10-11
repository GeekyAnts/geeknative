# {{APP_NAME}}

Native iOS, Android and web apps built from one spec by your coding agent, using [geeknative](https://www.npmjs.com/package/geeknative).

## Get started

1. `make doctor` checks Xcode, the Android SDK, Java and Node. `make doctor FIX=1` installs what it can.
2. `make check` builds and tests all three apps.
3. Open this folder in your coding agent (Claude Code, Codex, Cursor, Gemini CLI, ...) and describe what you want to build.

## Run the apps

| Command | Opens |
|---|---|
| `make run-ios` | The iOS app in a simulator |
| `make run-android` | The Android app on an emulator or connected device |
| `make run-web` | The web app at http://localhost:3000 |

## What's where

| Path | Contents |
|---|---|
| AGENTS.md | Instructions every coding agent follows |
| PRODUCT.md, DESIGN.md, spec/ | What the app does and how it looks |
| contracts/ | App identity, design tokens, copy and icons, compiled into each app by `make gen` |
| apps/ios, apps/android, apps/web | The three native apps |

Run `make` to see every command.
