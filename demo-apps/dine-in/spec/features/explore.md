---
id: explore
title: Explore
status:
  ios: planned
  android: planned
  web: planned
---

# Explore

## Summary

An elegant way to search and browse every restaurant in the Club: free-text search, filters for cuisine, neighbourhood, price, rating and availability, three sort orders, and a grid or list presentation.

## Screens and states

**Explore** (`explore`, tab root):

1. `ScreenHeader`: `explore.subtitle` as overline, `explore.title` in serif `display`.
2. **Search row**: a text field on `GlassSurface` (radius `full`, height `size.button`) with `search` icon, placeholder `explore.searchPlaceholder` and a clear button (`close`, `explore.clearSearch`) when not empty; trailing `GlassIconButton` `filter` (`explore.filters`) with an `accent` badge showing the number of active filters → Filters sheet. The search row sticks to the top while scrolling (it becomes `glassStrong`).
3. **Quick filter chips** (horizontal): one `Chip` per cuisine (multi-select toggles), preceded by an `Available today` chip (`explore.filter.availableToday`, toggles the availability filter). Active collection filter (from Discover) shows first as a selected chip with the collection title and a `close` icon (`explore.removeFilter`) that removes it.
4. **Results bar**: `explore.results` count in `label` `onSurfaceVariant`; trailing a sort menu button (`sort` icon + current sort label, `explore.sort`) and a grid/list toggle (`grid` / `list`, labels `explore.view.grid` / `explore.view.list`).
5. **Featured row** (only when no search text and no filters are active): `Overline` `explore.featured`, horizontal `RestaurantCard`s for featured restaurants.
6. **Results**: `RestaurantListItem`s (list) or `RestaurantGridItem`s (grid). Items fade/slide in when results change. Tap → Restaurant.
7. `DemoNote` with `common.demoAvailabilityNote`.

**Filters sheet** (native sheet, large): sections Cuisine (chips, multi), Neighbourhood (chips, multi, distinct catalog neighbourhoods sorted alphabetically), Price (four chips "₹" … "₹₹₹₹", multi), Rating (single choice chips: `explore.filter.rating.any`, then `explore.filter.rating.min` with 4.5, 4.7, 4.8), Availability (toggle row `explore.filter.availableToday`). Footer: `explore.filter.clear` text button and `PrimaryButton` `explore.filter.apply` with the live result count (disabled at zero). Changes in the sheet apply only when the apply button is tapped; dismissing the sheet discards them.

States: loading → three list skeletons; error → `ErrorState`; empty results → `EmptyState` (`search`, `explore.empty.title`, `explore.empty.body`) with a `explore.filter.clear` button when filters are active; success as above.

## Behavior and rules

- `ExploreFilters { query: String, cuisines: Set<CuisineId>, neighbourhoods: Set<String>, priceLevels: Set<Int>, minRating: Double?, availableToday: Bool, collection: CollectionId? }`. Default: all empty / null / false.
- A restaurant matches when all apply: the query matches (catalog spec "Search text matching") any of name, cuisine label, neighbourhood, tagline, the titles of its collections, or the labels of its amenities; its cuisine is in `cuisines` (if not empty); its neighbourhood is in `neighbourhoods` (if not empty); its price level is in `priceLevels` (if not empty); its rating ≥ `minRating`; today's demo availability is `available` (if `availableToday`); it belongs to `collection` (if set).
- Active filter count (badge) = number of non-empty sets + (minRating set ? 1 : 0) + (availableToday ? 1 : 0) + (collection set ? 1 : 0). The query isn't counted.
- Sort `ExploreSort`: `popularity` (default; reviewCount descending), `rating` (rating descending, then reviewCount descending), `distance` (distanceKm ascending). Ties keep catalog order.
- Search filters as the member types (debounced 200 ms).
- View mode is stored under `explore.viewMode` as `list` (default) or `grid`, shared by all members on the device.
- Arriving from Discover with `q`, `cuisine` or `collection` replaces the current filters with just that one; the search field takes focus when arriving from Discover's search bar.

## Acceptance criteria

- AC-explore-1: With no filters, all 10 restaurants show, sorted by popularity.
- AC-explore-2: Searching "koyo" finds Kōyō; searching "rooftop" finds the restaurants in the Rooftop collection or with the Rooftop amenity.
- AC-explore-3: Cuisine, neighbourhood, price, rating and availability filters combine (all must match).
- AC-explore-4: Sorting by rating and by distance orders the results as specified.
- AC-explore-5 (ui): The empty state shows when nothing matches, and clearing filters restores results.
- AC-explore-6: The grid/list choice is remembered after restart.
- AC-explore-7: The filters sheet's apply button shows the live count and applies the changes; dismissing discards them.

## Copy

`explore.*`, `cuisine.*`, `collection.*`, `common.demoAvailabilityNote`.

## Platform notes

- Sort menu: iOS `Menu`, Android `DropdownMenu`, web a native `<select>` styled as a chip (or a small popover list).

## Test IDs

- `explore.search`, `explore.clearSearch`, `explore.filtersButton`, `explore.sortButton`, `explore.viewToggle`, `explore.resultsCount`
- `explore.chip.availableToday`, `explore.chip.cuisine.<cuisineId>`, `explore.chip.collection`
- `explore.result.<restaurantId>`
- `explore.empty`, `explore.clearFilters`
- `explore.filters.apply`, `explore.filters.clear`, `explore.filters.neighbourhood.<index>`, `explore.filters.price.<level>`, `explore.filters.rating.<value>` (`any`, `45`, `47`, `48`), `explore.filters.availableToday`, `explore.filters.cuisine.<cuisineId>`

## Assumptions and open questions

- Assumption: "experience" search covers collections and amenities (romantic, rooftop, chef's table, live music…).
