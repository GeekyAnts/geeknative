---
id: place-details
title: Place details
status:
  ios: done
  android: done
  web: done
---

# Place details

## Summary

One screen for an attraction, hotel, restaurant or activity: a large photograph, the story, location, rating, hours and duration, plus Save and Add to Trip.

## User stories

- As a traveler, I want the details of a place so I know whether it belongs on my days.
- As a traveler, I want to save it or drop it onto a trip without leaving the photo.

## Screens and states

**Place details** (`placeId`)

- Hero photograph at `placeHero` height, scrim, place name and kind label.
- Rating (`place.rating`), location (`place.location` + catalog location), opening hours (`place.hours` + catalog `openingHours`), duration (`place.duration` from `durationMinutes`) when `durationMinutes > 0`. Hotels also show `place.pricePerNight`.
- Description (catalog).
- Actions: Save (`place.save` / `place.unsave`) and Add to Trip (`place.addToTrip`).
- Error: unknown id shows `place.errorTitle` / `place.errorBody`.

**Add to trip** (sheet / dialog)

- If the traveler has at least one draft or upcoming trip whose `destinationId` matches the place: list those trips; choosing one appends the place as a trip item on day 1 (creating day 1 if needed) at 09:00 with the place's `durationMinutes`, `completed: false`. Confirm with `place.added` (platform toast / snackbar / brief banner).
- If none: message `place.addToTripEmpty` and action `place.startTrip`, which opens Trip planner with this place's `destinationId`.

## Behavior and rules

- Save toggles `{ id: placeId, kind }` where `kind` is the place's kind.
- Opening hours and duration are catalog fields. Duration is always shown with `place.duration` (minutes).
- Images use `RemoteImage`. If `gallery` is present, show a horizontal pager of `imageUrl` plus gallery URLs; otherwise the single hero photo.

## Acceptance criteria

- AC-place-details-1: Place details shows a photograph, name, rating, location, description, opening hours and duration.
- AC-place-details-2: Save adds and removes the place from Saved.
- AC-place-details-3 (ui): Add to Trip either lists matching trips or opens Trip planner for this destination.
- AC-place-details-4: An unknown place id shows the error state.

## Copy

Keys under `place.*`, `kind.*`.

## Platform notes

- iOS: name on the hero; Add to Trip uses a sheet. Tab bar is not visible (pushed).
- Android: Add to Trip uses a modal bottom sheet; snackbar for `place.added`. Tab bar hidden.
- Web: `/place/$placeId`; native `<dialog>` for the trip picker; `Page width="full"`.

## Test IDs

- `place.hero`
- `place.save`
- `place.addToTrip`
- `place.trip.<tripId>`
- `place.startTrip`
- `place.error`

## Assumptions and open questions

- Adding to a trip always appends to day 1 rather than asking which day.
