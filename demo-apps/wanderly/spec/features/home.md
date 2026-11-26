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

The first tab. A photographic front door: search, one large featured destination, trending cities, category chips, popular attractions and travel inspiration.

## User stories

- As a traveler, I want to search a destination from Home so I can start exploring immediately.
- As a traveler, I want to browse trending cities and categories as photographs so I can pick by mood.

## Screens and states

**Home**

- Title: the app name, from contracts/app.json. On web the name lives in the site header; the page does not repeat a large `h1` of the app name (the featured overlay is the visual title).
- Search field, placeholder `home.searchPlaceholder`. Submitting (keyboard search / enter) opens Explore with `q` set. Tapping a category chip opens Explore with `category` set.
- Featured destination: the catalog destination with `featured: true`. Full-width photograph at `featured` height, scrim, overlay label `home.featuredLabel`, destination name, country.
- Trending: horizontal row of destinations with `trending: true`, in catalog order. Each card is a photograph with the city name overlaid. The seven required cities are Paris, Bali, Tokyo, Dubai, London, Rome, Singapore.
- Categories: Beaches, Mountains, Adventure, History, Food — in that order — with the matching icon (`waves`, `mountain`, `sparkles`, `landmark`, `utensils`).
- Popular attractions: places with `popular: true`, each a photo card with name, destination name, rating.
- Inspiration: destinations listed in `catalog.inspirationDestinationIds`, large photo cards with name, tagline and a short description.
- Catalog reads are local and synchronous after load, so there is no spinner. If the catalog fails to load (corrupt bundle), show `city.errorTitle` / `city.errorBody` and `common.retry`.
- No empty state: the catalog always has featured, trending, categories and popular places.

## Behavior and rules

- Search submit trims whitespace. An empty submit opens Explore with no query.
- Tapping featured, trending or inspiration opens City details for that `destinationId`.
- Tapping a popular attraction opens Place details for that `placeId`.
- Images use `RemoteImage` (DESIGN.md) with `catalog.fallbackImageUrl`.

## Acceptance criteria

- AC-home-1: Home shows a destination search field.
- AC-home-2: Home shows the featured destination's photograph and name.
- AC-home-3 (ui): Tapping the featured destination or a trending destination opens City details.
- AC-home-4: Home lists Paris, Bali, Tokyo, Dubai, London, Rome and Singapore as trending destinations, in that order.
- AC-home-5: Home shows category chips for Beaches, Mountains, Adventure, History and Food.
- AC-home-6 (ui): Tapping a category opens Explore with that category selected.
- AC-home-7: Home shows popular attractions with photographs and names.

## Copy

Keys under `home.*`, `tabs.home`, `category.*`.

## Platform notes

- iOS: large navigation title is the app name; search sits under it. Settings is not on this screen.
- Android: top app bar with the app name; no settings gear.
- Web: site header shows the app name and tab links. Home uses `Page width="full"`. The featured overlay is the visual title; do not add a second `h1` of the app name.

## Test IDs

- `home.search`
- `home.featured`
- `home.trending.<destinationId>` (example: `home.trending.paris`)
- `home.category.<category>` (example: `home.category.beaches`)
- `home.popular.<placeId>`
- `home.inspiration.<destinationId>`
- `home.title` (not on iOS): the app name in chrome (Android app bar, web header)

## Assumptions and open questions

- Featured destination is Bali (`featured: true` in the catalog).
- Submitting search from Home always routes to Explore rather than filtering Home in place.
