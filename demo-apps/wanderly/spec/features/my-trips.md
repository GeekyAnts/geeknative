---
id: my-trips
title: My trips
status:
  ios: done
  android: done
  web: done
---

# My trips

## Summary

The Trips tab. Upcoming, past and draft itineraries as destination-cover cards, with view, edit and delete.

## User stories

- As a traveler, I want my plans in one list so I can reopen an itinerary.
- As a traveler, I want to drop a draft I no longer need.

## Screens and states

**My trips**

- Title: `trips.title`.
- Three segments, in order: `trips.upcoming`, `trips.past`, `trips.drafts`. Platform segmented control / tabs / chip row.
- Each row: destination cover (`cardImage`), title, `itinerary.dates`, status is implied by the segment. Actions: open (the card), delete (icon `trips.deleteTitle` as accessibility label, using `common.delete`).
- Empty per segment: matching `trips.empty*` title and body, plus `trips.plan` on Upcoming and Drafts (opens Trip planner with no destination).
- Opening a card goes to Itinerary (same screen as after generate) where the traveler views and edits.

## Behavior and rules

- **Upcoming:** `status == upcoming` OR (`status == draft` is false AND `endDate >= today` AND `status != past`). After save from Itinerary, generate uses draft; `itinerary.saveTrip` sets `upcoming` if `endDate >= today` else `past`.
- Classification for the list (evaluate on read, using local calendar today `YYYY-MM-DD`):
  - `draft` → Drafts
  - else if `endDate < today` → Past (also rewrite status to `past` on read)
  - else → Upcoming
- Delete: confirm with `trips.deleteTitle` / `trips.deleteBody`, confirm button `common.delete`, cancel `common.cancel`. On confirm, remove from `trips.list`.
- Persist under `trips.list`. Missing key is `[]`. Invalid JSON is treated as `[]`.

## Acceptance criteria

- AC-my-trips-1: Trips are split into Upcoming, Past and Drafts using the status/date rules.
- AC-my-trips-2 (ui): Opening a trip shows its itinerary.
- AC-my-trips-3: Deleting a trip after confirmation removes it from the list and from storage.
- AC-my-trips-4: An empty segment shows that segment's empty state.
- AC-my-trips-5: Trips are still listed after an app restart.

## Copy

Keys under `trips.*`, `itinerary.dates`, `common.delete`, `common.cancel`.

## Platform notes

- iOS: `Picker` with `.segmented` under the large title. Delete can be a swipe action plus an icon; confirmation is a dialog.
- Android: `SingleChoiceSegmentedButtonRow` or equivalent; confirm with `AlertDialog`. Tab bar visible.
- Web: three buttons as a segmented group; confirm with `<dialog>`.

## Test IDs

- `trips.segment.upcoming`
- `trips.segment.past`
- `trips.segment.drafts`
- `trips.card.<tripId>`
- `trips.delete.<tripId>`
- `trips.empty`
- `trips.plan`
- `trips.title` (not on iOS)

## Assumptions and open questions

- There is no separate edit screen: Itinerary is the editor.
