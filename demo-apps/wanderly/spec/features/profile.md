---
id: profile
title: Profile
status:
  ios: done
  android: done
  web: done
---

# Profile

## Summary

The traveler's name, email, default trip preferences and a door to Settings.

## User stories

- As a traveler, I want Wanderly to remember how I usually travel so new plans start closer to right.

## Screens and states

**Profile**

- Title: `profile.title`.
- Initials avatar (first letters of the name) on a `primary` circle, `onPrimary` letters. No photo picker.
- Name field (`profile.name`) and email field (`profile.email`). Placeholder `profile.defaultName` / `profile.emailPlaceholder` when empty. Edits persist on change (or on end editing — see assumptions).
- Section `profile.preferences`: usual travelers (1–8 stepper), usual budget (three budget choices), favorite categories (chips, multi-select).
- Row / button `profile.openSettings` opens Settings.
- Version line uses `settings.about.version` (same as Settings).

## Behavior and rules

Storage key `profile.data`, JSON:

```
{
  "displayName": string,          // default ""
  "email": string,                // default ""
  "defaultTravelers": int,        // default 2, clamped 1–8
  "budgetBand": "value"|"mid"|"luxury",  // default "mid"
  "preferredCategories": string[] // default []
}
```

Missing or invalid values fall back to those defaults. Trip planner reads these as initial values when the form opens.

Displayed name: `displayName` if non-empty, else `profile.defaultName`.

## Acceptance criteria

- AC-profile-1: The traveler can change name and email, and the new values are still there after a restart.
- AC-profile-2: Usual travelers, budget and favorite categories persist and prefill Trip planner.
- AC-profile-3 (ui): The Settings entry opens Settings.
- AC-profile-4: Profile shows the app version and build number.

## Copy

Keys under `profile.*`, `budget.*`, `category.*`, `settings.about.version`.

## Platform notes

- iOS: `Form` on `background` with `surface` rows, like Settings.
- Android: column / cards; tab bar visible.
- Web: readable `Page`; `/profile`.

## Test IDs

- `profile.name`
- `profile.email`
- `profile.travelers`
- `profile.budget.value` / `profile.budget.mid` / `profile.budget.luxury`
- `profile.interest.<category>`
- `profile.openSettings`
- `profile.version`
- `profile.title` (not on iOS)

## Assumptions and open questions

- Email is not validated beyond being stored as typed. There is no sign-in.
- Name and email persist when the field loses focus (not on every keystroke), to match typical form behavior.
