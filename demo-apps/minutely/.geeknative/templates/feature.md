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

Testable and platform-neutral. Each platform's tests put these IDs in their names.

- AC-feature-id-1: ...
- AC-feature-id-2: ...

## Copy

New or changed keys in contracts/strings.

## Platform notes

Where the platforms intentionally differ (navigation chrome, controls, gestures), and anything platform-only.

## Test IDs

- `feature.element`: ...

## Assumptions and open questions

- Assumption: ...
