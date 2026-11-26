---
id: saved
title: Saved
status:
  ios: done
  android: done
  web: done
---

# Saved

## Summary

Destinations, attractions, hotels and restaurants (and activities) the traveler has hearted, with photographs, ready to reopen.

## User stories

- As a traveler, I want everything I hearted in one place so I can continue from a photo I loved.

## Screens and states

**Saved**

- Title: `saved.title`.
- Section `saved.destinations`: saved items with `kind == destination`, photo cards.
- Section `saved.places`: all other kinds, photo cards with kind label.
- Empty (no items at all): `saved.emptyTitle` and `saved.emptyBody`.
- Each card has an unsave heart.

## Behavior and rules

- Storage key `saved.items`, JSON array of `{ "id": string, "kind": "destination" | "attraction" | "hotel" | "restaurant" | "activity" }`. Newest first.
- Missing or invalid value is `[]`. Duplicate ids are collapsed to one (keep first).
- Unsave removes the item immediately.
- Tapping a destination card opens City details. Tapping a place opens Place details.
- Items whose catalog id no longer exists are omitted from the list (not shown as errors).

## Acceptance criteria

- AC-saved-1: Saved lists destinations and places the traveler has saved, with photographs.
- AC-saved-2: Unsaving from this screen removes the item from the list and from storage.
- AC-saved-3: When nothing is saved, the empty state is shown.
- AC-saved-4 (ui): Opening a saved destination shows City details.
- AC-saved-5: Saved items are still listed after an app restart.

## Copy

Keys under `saved.*`.

## Platform notes

- iOS: large title. Tab bar visible.
- Android: top app bar. Tab bar visible.
- Web: `/saved`, readable width is fine; photo grid may use `Page width="full"`.

## Test IDs

- `saved.destination.<destinationId>`
- `saved.place.<placeId>`
- `saved.unsave.<id>`
- `saved.empty`
- `saved.title` (not on iOS)

## Assumptions and open questions

- Activities are included in Places even though the product copy highlights destinations, attractions, hotels and restaurants.
