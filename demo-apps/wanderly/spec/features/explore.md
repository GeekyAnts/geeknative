---
id: explore
title: Explore
status:
  ios: done
  android: done
  web: done
---

# Explore

## Summary

Search destinations and places, filter by category, and browse a photographic grid of cities plus popular experiences.

## User stories

- As a traveler, I want to search across cities and places so I can jump to something specific.
- As a traveler, I want to filter by category so I only see matching destinations.

## Screens and states

**Explore**

- Title: `explore.title`.
- Search field, placeholder `explore.searchPlaceholder`, bound to `q`.
- Category chips (same five as Home). The selected chip uses `primary`. Tapping the selected chip again clears the filter.
- Destination grid: destinations matching the query and category, each a photo card with name and country.
- Places and experiences: matching places (any kind) below the grid, photo cards with name, kind label, destination name.
- Empty: when the filter matches nothing, `explore.emptyTitle`, `explore.emptyBody`, and `explore.clearFilters`.
- Success: catalog results. No loading spinner after the catalog is in memory.

## Behavior and rules

- Query matches (case-insensitive) destination `name`, `country`, `tagline`, `description`; place `name`, `summary`, `description`, `location`.
- Category filter: a destination matches if its `categories` contains the selected category. A place matches if its `category` equals the selected category. Both sections apply the same category.
- Query and category combine with AND.
- Empty query and no category: show every destination in catalog order, then popular places (those with `popular: true`), then other places grouped after.
- `clearFilters` clears both `q` and `category`.
- Tapping a destination opens City details. Tapping a place opens Place details.

## Acceptance criteria

- AC-explore-1: Typing a query shows destinations and places whose names match.
- AC-explore-2: Choosing a category shows only destinations (and places) tagged with that category.
- AC-explore-3 (ui): Tapping a destination opens City details.
- AC-explore-4: With no query and no category, Explore shows the full destination grid.
- AC-explore-5: A query with no matches shows the empty state.

## Copy

Keys under `explore.*`, `category.*`, `kind.*`.

## Platform notes

- iOS: large title `explore.title`; search under the title.
- Android: top app bar title; tab bar visible.
- Web: `Page width="full"`; path `/explore?q=&category=`.

## Test IDs

- `explore.search`
- `explore.category.<category>`
- `explore.destination.<destinationId>`
- `explore.place.<placeId>`
- `explore.empty`
- `explore.clearFilters`
- `explore.title` (not on iOS)

## Assumptions and open questions

- Opening Explore from a Home category pre-selects that chip and scrolls to the destination grid.
