---
title: Specs and parity
description: The feature spec format, acceptance criteria IDs, platform status, and how make parity reports coverage.
---

## Feature specs

Each feature has a spec in `spec/features/<id>.md`, started from `.geeknative/templates/feature.md`:

```md
---
id: notes               # kebab-case; used in file names and acceptance criteria IDs
title: Notes
status:                 # planned | in-progress | done | n/a (not on this platform)
  ios: planned
  android: planned
  web: planned
---

# Notes

## Summary
## User stories
## Screens and states        (loading, empty, error and success for each screen)
## Behavior and rules        (including stored data: keys, values and types)
## Acceptance criteria
- AC-notes-1: ...
- AC-notes-2: ...
## Copy
## Platform notes            (where platforms intentionally differ)
## Test IDs
## Assumptions and open questions
```

The front matter `status` records where each platform stands:

| Status | Meaning |
|---|---|
| `planned` | Specified, not built yet |
| `in-progress` | Partly built |
| `done` | Built and verified |
| `n/a` | Not on this platform, on purpose |

## Acceptance criteria

Criteria are testable and platform-neutral, and numbered `AC-<feature-id>-<n>`. Every platform's tests put the ID in the test name:

```swift
@Test("AC-settings-1: appearance defaults to System")
```

```kotlin
@Test
fun `AC-settings-1 appearance defaults to System`() = runTest { ... }
```

```ts
test('AC-settings-1: appearance defaults to System', async () => { ... })
```

Mark a criterion `(ui)` when it's about what the user sees or taps:

```markdown
- AC-home-3 (ui): Home has an entry point that opens Settings.
```

Only a test that drives the real UI covers a `(ui)` criterion: an XCUITest in `apps/ios/AppUITests` (put the ID in `XCTContext.runActivity(named:)`), a Compose UI test on Android (a file that creates a compose rule, run on Robolectric), or a web test that renders into a DOM (`// @vitest-environment happy-dom` with `createRoot`, `hydrateRoot` or `render`). A test that checks a view model or a route names the criterion but doesn't cover it.

## make parity

`make parity` reads every spec in `spec/features/` (files starting with `_` are skipped), collects the criteria from list items that start with an `AC-` ID, and searches each app's tests for those IDs:

| App | Test files searched |
|---|---|
| iOS | Swift files in `apps/ios/*Tests/` |
| Android | Kotlin files in `apps/android/app/src/test/` and `src/androidTest/` |
| Web | `*.test.ts(x)` and `*.spec.ts(x)` files in `apps/web/src/`, and `apps/web/e2e/` |

It writes `spec/parity.md` and prints the gaps. A gap is a criterion no test names, or a `(ui)` criterion only non-UI tests name:

```text
! cart       iOS done 6/7 · Android done 7/7 · Web done 7/7
             AC-cart-5 needs a UI test on iOS (only other tests name it)
✔ settings   iOS done 4/4 · Android done 4/4 · Web done 4/4
Wrote spec/parity.md
```

`spec/parity.md` has a summary table and a per-criterion table:

| Feature | iOS | Android | Web |
|---|---|---|---|
| Home | ✅ done · 3/3 tested | ✅ done · 3/3 tested | ✅ done · 3/3 tested |
| Settings | ✅ done · 4/4 tested | ✅ done · 4/4 tested | ✅ done · 4/4 tested |

In the per-criterion table, ✅ means covered, ❌ untested, and 🟡 a `(ui)` criterion that only non-UI tests name.
