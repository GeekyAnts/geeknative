---
id: home
title: Home
status:
  ios: done
  android: done
  web: done
---

# Home

## Summary

The first screen. It names the app, welcomes the user and leads to Settings. It's a starting point: replace its content as the product takes shape.

## Screens and states

**Home**

- Title: the app name, from contracts/app.json.
- A welcome card with `home.welcomeTitle` and `home.welcomeBody`.
- An entry point to Settings, labeled `home.openSettings`.
- Static content, so there are no loading, empty or error states.

## Acceptance criteria

- AC-home-1: Home shows the app name as its title.
- AC-home-2: Home shows the welcome card's title and text.
- AC-home-3: Home has an entry point that opens Settings.

## Platform notes

- iOS: large navigation title; the Settings entry is a gear button in the toolbar.
- Android: top app bar with the app name; the Settings entry is a gear action in the app bar.
- Web: the page heading is the app name; Settings is a gear link in the site header, on every page.

## Test IDs

- `home.openSettings`: the Settings entry point.

## Assumptions and open questions

- Assumption: AC-home-3 needs a UI-level test (tap the entry point, see Settings open), and the template has no UI test harness on purpose: it would add dependencies and build time to every project. Until a project adds one, `make parity` shows AC-home-3 as untested, and it is checked by hand.
- Manual check for AC-home-3, on each platform: open Home, tap the gear (`home.openSettings`), and confirm Settings opens; then go back and confirm Home is intact.
- AC-home-1 and AC-home-2 are unit-tested on iOS and Android only at the value level (the name and strings exist), since text on screen can't be read without a UI harness. Web renders the screen and checks the text.
