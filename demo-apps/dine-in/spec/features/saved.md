---
id: saved
title: Saved
status:
  ios: planned
  android: planned
  web: planned
---

# Saved

## Summary

Members keep a private collection of favourite restaurants by tapping the heart anywhere a restaurant appears.

## Screens and states

**Saved** (`saved`, tab root):

1. `ScreenHeader`: `saved.subtitle` overline, `saved.title` in serif `display`, and `saved.count` in `body` `onSurfaceVariant`.
2. A list of `RestaurantListItem`s for the saved restaurants, most recently saved first. Each has its `FavouriteButton` (filled); un-saving removes the item with a fade/collapse animation. Tap → Restaurant.

States: loading → two list skeletons; error → `ErrorState`; empty → `EmptyState` (`heart`, `saved.empty.title`, `saved.empty.body`, button `saved.empty.cta` → Explore tab).

## Behavior and rules

- `SavedRepository`: `ids() -> [String]` (most recent first), `toggle(restaurantId) -> Bool` (returns the new saved state), `isSaved(id)`, and an observable stream (query invalidation on web) so every heart in the app updates at once. Implementations: local (`UserDefaultsSavedRepository`, `DataStoreSavedRepository`, `LocalStorageSavedRepository`) and `InMemorySavedRepository`.
- Stored as a JSON array of restaurant IDs under `saved.<email>`, most recently saved first. Saving an already-saved ID does nothing; IDs not in the catalog are ignored when shown.
- The `FavouriteButton` animates (DESIGN.md) and triggers a light haptic on iOS and Android.

## Acceptance criteria

- AC-saved-1: Toggling a restaurant saves it (first in the list) and toggling again removes it.
- AC-saved-2: Saved restaurants persist after restart and belong to the signed-in member only.
- AC-saved-3 (ui): Saved shows the empty state with no saved restaurants, and the saved restaurants otherwise.
- AC-saved-4 (ui): Un-saving from the Saved list removes the restaurant from the list.

## Copy

`saved.*`, `restaurant.save`, `restaurant.unsave`.

## Platform notes

- None.

## Test IDs

- `saved.item.<restaurantId>`, `saved.empty`, `saved.count`
- `favourite.<restaurantId>` (from spec/features/discover.md)

## Assumptions and open questions

- None.
