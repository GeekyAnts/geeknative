---
title: Quick start
description: Create a geeknative project, check your toolchains, build all three apps and give your agent its first prompt.
---

1. **Create a project.**

   ```sh
   npm create geeknative@latest my-app -- --name "My App" --id com.acme.myapp
   ```

   `--name` is the display name and `--id` is the bundle ID on iOS and the application ID on Android. Both are written to `contracts/app.json`, the only place they live. Without them, the name comes from the folder (`my-app` becomes "My App") and the ID is `com.example.myapp`.

   The command copies the template, generates the platform code, installs dependencies with npm and makes a first git commit. Add `--no-install` or `--no-git` to skip those steps.

   You can also run the CLI directly: `npx geeknative@latest create my-app --name "My App" --id com.acme.myapp`.

2. **Check your toolchains.**

   ```sh
   cd my-app
   make doctor
   ```

   `make doctor` checks Node, the npm dependencies, the contracts, Xcode and an iPhone simulator, Java, and the Android SDK. `make doctor FIX=1` installs what it safely can: npm dependencies and the Android API level the app compiles against. See [Requirements](/docs/start-here/requirements/).

3. **Build and test all three apps.**

   ```sh
   make check
   ```

   This validates the contracts, then builds and tests the iOS, Android and web apps, printing one line per app. Full logs go to `.geeknative/logs/`.

   :::note
   The first Android build downloads Gradle, JDK 21 and the app's dependencies, so it can take several minutes. Later builds take seconds.
   :::

4. **Run the apps.**

   ```sh
   make run-ios       # builds, installs and launches in an iPhone simulator
   make run-android   # installs and launches on a connected device or an emulator
   make run-web       # starts the dev server at http://localhost:3000
   ```

5. **Give your agent its first prompt.**

   Open the folder in Claude Code, Codex, Cursor, Gemini CLI or another agent that reads AGENTS.md, and describe your app:

   > Build a habit tracker. People create habits, check them off each day, and see their current streak.

   The agent fills in PRODUCT.md and DESIGN.md, writes a spec for each feature, and builds them one at a time on all three platforms. See [From idea to three apps](/docs/guides/idea-to-three-apps/).


## Run `make` to see every command

```text
  make help             List the commands
  make doctor           Check toolchains (FIX=1 installs what it can)
  make gen              Regenerate app code from contracts/
  make check            Validate contracts, then build and test all three apps
  make check-contracts  Validate contracts and check generated code is current
  make check-ios        Build and test the iOS app
  make check-android    Build and test the Android app
  make check-web        Type-check, test and build the web app
  make parity           Update spec/parity.md from feature specs and tests
  make run-ios          Build and launch the iOS app in a simulator
  make run-android      Build and launch the Android app on an emulator or device
  make run-web          Start the web dev server
```

The [CLI reference](/docs/reference/cli/) describes each one.
