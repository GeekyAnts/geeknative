---
id: destinations
title: Destinations
status:
  ios: done
  android: done
  web: done
---

# Destinations

## Summary

Couples browse wedding destinations by region and style, filter by guests and budget, read seasonal notes, and open a destination to see its venues and packages.

## User stories

- As a couple, I want to filter destinations by style and size so that I only see places that fit our celebration.
- As a couple, I want to save a destination so that it appears on My Wedding.
- As a couple, I want to open a destination and see its venues so that I can continue toward a booking.

## Screens and states

**Destinations**

- Title `destinations.title`.
- Filters: style chips, guest capacity, budget, optional location text.
- A seasonal recommendations band `destinations.seasonalTitle`.
- A grid/list of destination cards (photograph, name, region, short description, `destinations.explore`).
- Empty filter result: `destinations.emptyTitle` and `destinations.emptyBody`.
- Catalog is local and immediate: no loading or error state.

**Destination detail**

- Photograph gallery, name, region, description, style, guest range, budget range, seasonal note, package names, venues in that destination, save control.

## Behavior and rules

- Style values: `beach`, `royal`, `garden`, `mountain`, `heritage`, `luxuryResort`. A destination may have several styles; a selected style matches if the destination includes it. No style selected means all.
- Guest filter: a destination matches when `guestCapacityMax >= guests` (and guests > 0). 0 means no guest filter.
- Budget filter: a destination matches when `budgetMin <= budget` (and budget > 0). 0 means no budget filter.
- Location filter: case-insensitive contains on name, country or region. Empty means all.
- Save toggles the destination id in `WeddingPlan.savedDestinationIds`.
- Catalog ids: `udaipur`, `goa`, `jaipur`, `bali`, `tuscany`, `santorini`.

## Acceptance criteria

- AC-destinations-1: Destinations shows every catalog destination when no filter is applied.
- AC-destinations-2: Choosing a style hides destinations that do not include that style.
- AC-destinations-3: A guest count hides destinations whose maximum capacity is below it.
- AC-destinations-4: Opening a destination shows its name and description.
- AC-destinations-5: Saving a destination adds its id to the wedding plan's saved destinations.

## Copy

Keys under `destinations.*` and `style.*` in contracts/strings.

## Platform notes

- Filter controls are native: iOS uses a chip row and steppers/fields; Android uses FilterChips and fields; web uses buttons and inputs.
- Web path `/destinations?style=&guests=&budget=&location=&date=` hydrates the same filters.

## Test IDs

- `destinations.list`: destination results.
- `destinations.filter.style`: style filters.
- `destinations.filter.guests`: guest filter.
- `destinations.filter.budget`: budget filter.
- `destinations.empty`: empty results.
- `destinations.card.<id>`: a destination card.
- `destinations.save`: save control on detail.
- `destinations.venues`: venues for this destination.

## Assumptions and open questions

- Seasonal recommendations are the destinations whose `seasonalNote` mentions the current month's season; if none match, show the first three catalog destinations.
