---
id: restaurant
title: Restaurant
status:
  ios: planned
  android: planned
  web: planned
---

# Restaurant

## Summary

An immersive restaurant profile: a full-width photo gallery, the story and ambience, practical details (hours, location, amenities, dress code), signature dishes, menu highlights and guest reviews, with a floating "Reserve a table" bar always in reach.

## Screens and states

**Restaurant** (`restaurant(restaurantId)`, pushed):

1. **Gallery** (height `size.detailHeroHeight`, full width, extends under the status bar): horizontally paged photos (`gallery`), with parallax/stretch on pull-down. Overlaid: `TopBar` with a `GlassIconButton` back (`common.back`) and a trailing `FavouriteButton`; bottom-trailing glass pill with `restaurant.galleryPosition` ("1 of 3"); page dots centred at the bottom. Bottom scrim.
2. **Title block** on a `background` sheet that overlaps the gallery by `xl` with top corners radius `xl`: cuisine label overline (`accent`), name in serif `headline`, tagline in serif italic `title` in `onSurfaceVariant`; a row with `RatingBadge`, `restaurant.reviewCount`, `PriceLevel`, `restaurant.costForTwo` (`format.price` of `costForTwo`); a row with `location` icon + neighbourhood · `restaurant.distance`; `AvailabilityIndicator` for today.
3. **About** (`SectionHeader` overline-less with serif `title` `restaurant.about`): `about` in `body`.
4. **Ambience & experience** (`restaurant.ambience`): `ambience` text over a wide second gallery photo with radius `lg`.
5. **Signature dishes** (`restaurant.signatureDishes`): horizontal carousel of dish cards (`dishCardWidth`, photo square radius `lg`, serif `subtitle`-sized name using `AppSerif.title`, description `caption` 2 lines, price `label` in `primary`).
6. **Menu highlights** (`restaurant.menuHighlights`): a `surface` card with rows: name (`subtitle`), description (`caption`), and the price right-aligned, separated by hairlines; a dotted leader is optional.
7. **Opening hours** (`restaurant.hours`): seven rows Monday→Sunday (`date.weekday.*`), each with `format.timeRange` of formatted open/close or `restaurant.closed` in `onSurfaceVariant`; today's row is emphasised in `primary` with semibold weight.
8. **Location** (`restaurant.location`): a map card (radius `lg`, height `size.listImageHeight`): the OpenStreetMap tile at zoom 16 containing the restaurant (`x = floor((lon + 180) / 360 · 2¹⁶)`, `y = floor((1 − ln(tan(lat·π/180) + 1/cos(lat·π/180)) / π) / 2 · 2¹⁶)`, URL `https://tile.openstreetmap.org/16/{x}/{y}.png`), drawn as a square as wide as the card and cropped vertically so the restaurant's position (the fractional parts of x and y) is as close to the vertical centre as the tile allows, with a pin (`location` icon `lg` in `espresso` on an `accent` circle) at the restaurant's position and a `caption` attribution `restaurant.mapAttribution` in the corner. Below: the address in `body`, and two `SecondaryButton`s side by side: `restaurant.directions` (`directions` icon) and `restaurant.call` (`phone` icon).
9. **Amenities** (`restaurant.amenities`): wrapping grid of items, each an icon `md` in `accent` + label `amenity.<id>` in `label`.
10. **Dress code** (`restaurant.dressCode`, only when not null): `dressCode` icon + text.
11. **Guest reviews** (`restaurant.reviews`, with the rating in serif `display` and `restaurant.reviewCount` beside it): review cards (`surface`, radius `lg`, horizontal carousel) with a `quote` icon in `accent`, the text in `AppSerif.italic(title)`, author `label`, short date `caption`, and five small stars (filled up to the rating).
12. `DemoNote`.
13. **StickyActionBar** (floating, always visible): leading `restaurant.costForTwo` in `label` and the availability text in `caption`; trailing `PrimaryButton` `restaurant.reserve` → Reserve. It slides up when the screen appears.

The `TopBar` turns into a `glassStrong` bar showing the restaurant name in serif `title` once the gallery scrolls out of view.

States: loading → gallery skeleton and text skeletons; error → `ErrorState`; not found (unknown id) → `EmptyState` (`utensils`, `restaurant.notFound.title`, `restaurant.notFound.body`) with back.

## Behavior and rules

- Directions opens the platform's maps with the restaurant's coordinates as the destination: iOS `http://maps.apple.com/?daddr=<lat>,<lon>`, Android `geo:<lat>,<lon>?q=<lat>,<lon>(<name>)` (falling back to the Google Maps URL), web `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lon>` in a new tab.
- Call opens the dialer with `phone` (`tel:` URL, spaces removed).
- Reserve opens Reserve for this restaurant with no reservation (a new booking).

## Acceptance criteria

- AC-restaurant-1 (ui): The screen shows the restaurant's name, rating, cuisine, price level and about text.
- AC-restaurant-2: Opening hours list all seven days, show closed days as Closed, and emphasise today.
- AC-restaurant-3 (ui): Tapping Reserve a table opens Reserve for this restaurant.
- AC-restaurant-4 (ui): Tapping the heart saves the restaurant, and it appears in Saved.
- AC-restaurant-5: An unknown restaurant ID shows the not-found state.
- AC-restaurant-6: The map tile URL for Maison Lumière (18.9217, 72.8332) is `https://tile.openstreetmap.org/16/46026/29259.png`.

## Copy

`restaurant.*`, `amenity.*`, `cuisine.*`, `date.weekday.*`, `format.*`, `common.back`.

## Platform notes

- Gallery paging: iOS `TabView(.page)` or a paging `ScrollView`, Android `HorizontalPager`, web CSS scroll-snap.

## Test IDs

- `restaurant.name`, `restaurant.gallery`, `restaurant.about`, `restaurant.hours`, `restaurant.hours.<day>` (`mon`…`sun`), `restaurant.map`, `restaurant.directions`, `restaurant.call`, `restaurant.reserve`, `restaurant.notFound`
- `favourite.<restaurantId>` (from spec/features/discover.md)

## Assumptions and open questions

- Assumption: OpenStreetMap tiles are fine for a demonstration map; a production build should use a maps SDK or a tile provider with an API key (contracts/config.json `secrets`).
