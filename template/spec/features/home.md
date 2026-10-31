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
- AC-home-3 (ui): Home has an entry point that opens Settings.

## Platform notes

- iOS: large navigation title; the Settings entry is a gear button in the toolbar.
- Android: top app bar with the app name; the Settings entry is a gear action in the app bar.
- Web: the page heading is the app name; Settings is a gear link in the site header, on every page.

## Test IDs

- `home.openSettings`: the Settings entry point.

## Assumptions and open questions

- AC-home-3 is a (ui) criterion, so each platform covers it with a test that taps the real entry point: an XCUITest on iOS (apps/ios/AppUITests), a Compose UI test on Robolectric on Android, and a render into happy-dom on web. Each opens Settings and, on mobile, goes back to Home.
- iOS tests AC-home-1 and AC-home-2 at the value level (the name and strings exist, and Home lays out), since they don't need taps.
