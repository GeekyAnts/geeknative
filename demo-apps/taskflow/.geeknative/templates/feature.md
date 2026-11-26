---
id: feature-id          # kebab-case; used in file names and acceptance criteria IDs
title: Feature title
status:                 # planned | in-progress | done | n/a (not on this platform)
  ios: planned
  android: planned
  web: planned
---

# Feature title

## Summary

One or two sentences: what the user can do, and why.

## User stories

- As a <who>, I want <what> so that <why>.

## Screens and states

For each screen: what it's for, what it shows, and its loading, empty, error and success states.

## Behavior and rules

Business rules, validation, limits and edge cases. For stored data: the keys, values and types, identical on every platform.

## Acceptance criteria

Testable and platform-neutral. Each platform's tests put these IDs in their names. Mark a criterion `(ui)` when it's about what the user sees or taps (a button opens a screen, an empty state shows): only a test that drives the real UI covers it, not one that checks a view model or route.

- AC-feature-id-1: ...
- AC-feature-id-2 (ui): ...

## Copy

New or changed keys in contracts/strings.

## Platform notes

Where the platforms intentionally differ (navigation chrome, controls, gestures), and anything platform-only.

## Test IDs

- `feature.element`: ...
- `feature.title` (not on iOS): ... (a platform that can't carry the ID, here an iOS large title, is named like this so the lint doesn't expect it there)

## Assumptions and open questions

- Assumption: ...
