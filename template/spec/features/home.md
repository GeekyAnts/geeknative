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
