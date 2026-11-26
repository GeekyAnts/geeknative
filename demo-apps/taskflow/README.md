# Taskflow

A task manager built natively for iOS (SwiftUI), Android (Jetpack Compose) and the web (React + TanStack Start) from one spec with [geeknative](https://www.npmjs.com/package/geeknative), all backed by one Node.js + Express + SQLite API.

Create tasks with a priority and due date, filter by status and priority, tick them off from the list, and edit or delete them from the detail screen.

## Get started

1. `make doctor` checks Xcode, the Android SDK, Java and Node (22.13 or later). `make doctor FIX=1` installs what it can.
2. `npm install`, then `make run-backend` starts the API on http://127.0.0.1:8080 with 14 seed tasks.
3. `make check` builds and tests all three apps; `make check-backend` tests the API.

## Run the apps

Start the backend first (`make run-backend`), then:

| Command | Opens |
|---|---|
| `make run-ios` | The iOS app in a simulator |
| `make android-reverse && make run-android` | The Android app on an emulator or connected device (`android-reverse` forwards the device's port 8080 to the backend) |
| `make run-web` | The web app at http://localhost:3000 |

`make seed-backend` resets the data at any time.

## What's where

| Path | Contents |
|---|---|
| AGENTS.md | Instructions every coding agent follows |
| PRODUCT.md, DESIGN.md, spec/ | What the app does and how it looks |
| contracts/ | App identity, design tokens, copy, icons, config (`apiBaseUrl`) and the OpenAPI contract (`api.json`), compiled into each app by `make gen` |
| apps/ios, apps/android, apps/web | The three native apps. Each calls the API through its generated client |
| backend/ | The Taskflow API (see [backend/README.md](backend/README.md)) |
| previews/shots.json | The screens photographed for the geeknative showcase |

Run `make` to see every command.
