---
title: Requirements
description: The toolchains geeknative needs, and the minimum OS versions the apps support.
---

## Toolchains

| Tool | Needed for | Notes |
|---|---|---|
| Node.js 22 or later | Everything | 24 LTS recommended. Runs the CLI and the web app. |
| Xcode 26 or later | iOS | macOS only. Needs an iOS simulator runtime: `xcodebuild -downloadPlatform iOS`. |
| Android SDK | Android | From Android Studio, or `brew install --cask android-commandlinetools`. The app compiles against API 37; `make doctor FIX=1` installs it. |
| A JDK, 17 or later | Android | Only to start Gradle. Gradle then downloads JDK 21 for the build itself (see `apps/android/gradle/gradle-daemon-jvm.properties`), so your own JDK version doesn't matter beyond that. |
| make | The commands | Comes with the Xcode command line tools on macOS. |

On macOS you can build all three apps. On Linux you can build the Android and web apps: `make check` skips iOS with a warning, and `make check-ios` explains that iOS needs macOS. Windows hasn't been tested yet.

## Minimum OS versions

Each minimum is the lowest version the architecture allows.

| Platform | Minimum | Set by |
|---|---|---|
| iOS | iOS 17 | Observation (`@Observable`) |
| Android | Android 7.0 (API 24) | Navigation 3 |
| Web | Safari 16.4, Chrome 111, Firefox 128 | Tailwind CSS v4 |

## How the CLI finds your tools

**Android SDK.** `make doctor` and `make check-android` look in this order: `apps/android/local.properties`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `~/Library/Android/sdk`, `/opt/homebrew/share/android-commandlinetools`, `/usr/local/share/android-commandlinetools`, and `~/Android/Sdk`. When they find it, they write `apps/android/local.properties` (git-ignored) so Gradle uses it too.

**iOS simulator.** The CLI builds and tests on the simulator named in the `GEEKNATIVE_IOS_SIMULATOR` environment variable (a name or UDID), if set. Otherwise it uses a booted iPhone simulator, or an iPhone on the newest installed iOS runtime.

```sh
GEEKNATIVE_IOS_SIMULATOR="iPhone 17 Pro" make check-ios
```
