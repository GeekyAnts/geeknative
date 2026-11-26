---
id: city-details
title: City details
status:
  ios: done
  android: done
  web: done
---

# City details

## Summary

A destination's magazine spread: a large cover, travel facts, the city story, photographic collections of attractions, hotels, restaurants and activities, tips, and a Plan a Trip action.

## User stories

- As a traveler, I want the feel of a city in photographs and a few facts so I can decide whether to go.
- As a traveler, I want to start a trip from this city in one tap.

## Screens and states

**City details** (`destinationId`)

- Hero photograph at `hero` height, scrim, destination name (`display`) and country (`label`) in `onOverlay`. Save heart on the hero (icon-only, labeled `city.save` / `city.unsave`).
- Facts row, in this order: best time (`city.bestTime` + catalog `bestTimeToVisit`), weather (`city.weather` + `city.weatherValue`), currency (`city.currency` + catalog `currency` / `currencySymbol`), language (`city.language` + catalog `language`).
- Description (catalog).
- Sections in order: `city.attractions`, `city.hotels`, `city.restaurants`, `city.activities` — each a horizontal photographic row of places of that kind for this destination. Card: photo, name, rating.
- `city.tips`: catalog `travelTips`, each a surface card with the info icon.
- Primary button `city.planTrip`.
- Error: unknown `destinationId` shows `city.errorTitle` and `city.errorBody`.
- No empty collections: every catalog destination includes at least one of each kind.

## Behavior and rules

- Save toggles a saved item `{ id: destinationId, kind: "destination" }` in `SavedRepository`.
- Plan a Trip opens Trip planner with this `destinationId` preselected (and profile defaults for travelers, budget, interests).
- Tapping a place opens Place details.
- Images use `RemoteImage`.

## Acceptance criteria

- AC-city-details-1: City details shows the cover photograph, name, country and description.
- AC-city-details-2: City details shows best time to visit, weather, currency and language.
- AC-city-details-3: City details shows attractions, hotels, restaurants and activities, each with a photograph.
- AC-city-details-4 (ui): Plan a Trip opens Trip planner with this destination selected.
- AC-city-details-5 (ui): Tapping a place opens Place details.
- AC-city-details-6: The save control adds and removes the destination from Saved.
- AC-city-details-7: An unknown destination id shows the error state.

## Copy

Keys under `city.*`.

## Platform notes

- iOS: the destination name is on the hero, not a large navigation title. Back chevron over the hero uses `onOverlay`.
- Android: no large title in the app bar; back is `common.back`. Tab bar hidden.
- Web: `/city/$destinationId`, `Page width="full"`.

## Test IDs

- `city.hero`
- `city.save`
- `city.planTrip`
- `city.attractions`
- `city.hotels`
- `city.restaurants`
- `city.activities`
- `city.place.<placeId>`
- `city.error`

## Assumptions and open questions

- Review counts and ratings come from the catalog and are not user-editable.
