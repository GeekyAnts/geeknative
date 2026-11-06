---
id: settings
title: Settings
status:
  ios: done
  android: done
  web: done
---

# Settings

## Summary

Lets the user choose the app's appearance and see which version they're running.

## Screens and states

**Settings**, opened from Home.

- Section `settings.appearance.title` with three choices: System, Light and Dark. The current choice is selected.
- Section `settings.about.title` showing `settings.about.version` with the app version and build number.

## Behavior and rules

- The appearance applies to the whole app as soon as it's chosen. There's no save button.
- System follows the device's light or dark setting, including changes while the app is open.
- The choice is stored locally under the key `settings.appearance`, as `system`, `light` or `dark`. The key and values are the same on every platform.
- A missing or unknown stored value counts as `system`.

## Acceptance criteria

- AC-settings-1: Appearance defaults to System.
- AC-settings-2: Choosing an appearance applies it to the whole app immediately.
- AC-settings-3: The chosen appearance is still applied after the app restarts.
- AC-settings-4: Settings shows the app version and build number.

## Platform notes

- iOS: a `Form`, with the appearance as an inline `Picker` (checkmarks).
- Android: radio buttons in a selectable group; the top app bar has a back button, labeled `common.back`. That string is Android-only: iOS (navigation bar) and web (site header) get back from the system and the page chrome.
- Web: a radio group in a card. The stored appearance is applied before the first paint, so there's no flash of the wrong theme.

## Test IDs

- `settings.appearance`: the appearance choices.
- `settings.version`: the version text.

## Assumptions

- No "reset to defaults" action yet.
