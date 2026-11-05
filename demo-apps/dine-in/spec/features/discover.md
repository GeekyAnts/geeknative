---
id: discover
title: Discover
status:
  ios: planned
  android: planned
  web: planned
---

# Discover

## Summary

The first tab and the most important screen: an editorial, magazine-like home that immediately says "luxury", leads into search and exploration, and surfaces the member's next reservation. Also hosts Notifications (reservation reminders).

## Screens and states

**Discover** (`discover`, tab root). One vertical scroll, top to bottom:

1. **Greeting bar** (on `background`, scrolls away): `brand.tagline` as an `Overline`; then `discover.greetingName` with `discover.greeting.morning` (05:00–11:59), `.afternoon` (12:00–16:59) or `.evening` (otherwise) and the member's first name (text before the first space of `Account.name`), in serif `title`; below it a `location` icon `xs` + `discover.location` in `caption` `onSurfaceVariant`. Trailing: `GlassIconButton` bell (`discover.notifications`) with a small `accent` dot when there is at least one reminder → Notifications; avatar circle (`size.avatar`, `espresso` fill, `accent` ring, the member's initials in `onEspresso` `label`, label `discover.openProfile`) → Profile tab.
2. **Hero** (full content width minus `lg` margins, height `size.heroHeight`, radius `xl`): `catalog.heroImage` with parallax (the image moves at half the scroll speed and scales up when pulled down; off with reduce motion) under a `PhotoScrim`. Content at the bottom in `onGlassOnImage`: `discover.hero.overline` overline (in `accent`), a `GoldRule`, `discover.hero.title` in serif `hero`, `discover.hero.body` in `body`, and a glass pill button `discover.hero.cta` with `chevronRight` → Explore.
3. **Floating search bar** overlapping the bottom edge of the hero by half its height: `GlassSurface` (radius `full`, height `size.button`, `high` shadow) with `search` icon and placeholder `discover.searchPlaceholder`. Tapping opens Explore with the search field focused.
4. **Your next evening** (only when the member has an upcoming reservation): `Overline` `discover.upcoming.overline`, then a compact `espresso` card (radius `lg`): restaurant thumbnail (`size.thumbnail`), serif restaurant name in `onEspresso`, `format.separator` of short date and time, party size (`reserve.guestCount`) in `caption`, trailing `chevronRight` → Reservation detail.
5. **Cuisines**: `SectionHeader` (`discover.cuisines.overline`, `discover.cuisines.title`), then a horizontal row of `Chip`s for the 7 cuisines in catalog order (`cuisine.<id>`). Tap → Explore filtered by that cuisine.
6. **Curated collections**: `SectionHeader` (`discover.collections.overline`, `discover.collections.title`), horizontal carousel of six `CollectionCard`s with snapping. Tap → Explore filtered by that collection.
7. **Concierge's pick** spotlight (an editorial spread on a full-width `espresso` band with `xxl` vertical padding): restaurant `koyo`. `Overline` `discover.spotlight.overline` in `accent`, the restaurant's name in serif `display` (`onEspresso`), its tagline in serif italic `title` (`AppSerif.italic`), a wide photo (its second gallery image, radius `lg`, aspect 4:3), the first two sentences of `about` in `body` (`onEspresso` at 80% opacity), and a `SecondaryButton` in `onEspresso` colours `discover.spotlight.cta` → Restaurant.
8. **Recommended for you** (only when preferences have at least one favourite cuisine and at least one restaurant matches): `SectionHeader` (`discover.recommended.overline`, `discover.recommended.title`), horizontal row of featured `RestaurantCard`s for restaurants whose cuisine is in the favourites, sorted by rating.
9. **Featured restaurants**: `SectionHeader` (`discover.featured.overline`, `discover.featured.title`, trailing `common.seeAll` → Explore), horizontal snapping carousel of `RestaurantCard`s for `featured == true` in catalog order, each with its availability today and a `FavouriteButton`. Tap → Restaurant.
10. `DemoNote` with `common.demoAvailabilityNote`.

Sections fade in and slide up as they first scroll into view (DESIGN.md Motion).

States: loading → skeletons shaped like the hero, one chip row and one card carousel; error → `ErrorState` with retry; success as above. There is no empty state (the catalog always has restaurants).

**Notifications** (`notifications`, pushed): `TopBar` with back, `ScreenHeader` with `notifications.title`. A list of reminders, one per upcoming confirmed reservation within the next 7 days (sorted soonest first), each a `surface` card with a `bell` icon in an `accent` circle, `notifications.reminder` (restaurant name, short date, time) and a `caption` with the confirmation code; tap → Reservation detail. When reminders are turned off in Profile, or there are none: `EmptyState` (`bell`, `notifications.empty.title`, `notifications.empty.body`).

## Behavior and rules

- `DiscoverViewModel` combines the catalog, the member's account, saved IDs, reservations and preferences, and the clock.
- The bell's dot shows when Notifications would list at least one reminder.
- The favourite state on cards is shared with Saved and updates everywhere at once.

## Acceptance criteria

- AC-discover-1: The greeting uses the time of day and the member's first name.
- AC-discover-2 (ui): Discover shows the hero headline, the cuisine chips, the six collections and the featured restaurants.
- AC-discover-3 (ui): Tapping a cuisine opens Explore filtered by that cuisine.
- AC-discover-4 (ui): Tapping a featured restaurant opens its Restaurant screen.
- AC-discover-5: "Your next evening" shows only when there is an upcoming reservation, and shows the soonest.
- AC-discover-6: Notifications lists upcoming reservations within 7 days, and none when reminders are off.
- AC-discover-7: Recommended shows only restaurants whose cuisine is in the member's favourite cuisines.

## Copy

`discover.*`, `notifications.*`, `cuisine.*`, `collection.*`, `restaurant.availability.*`, `common.seeAll`, `common.demoAvailabilityNote`.

## Platform notes

- None beyond DESIGN.md: identical layout everywhere. On web wider than 1024 px the hero is 1.2× `size.heroHeight` and carousels show more cards; it is still the same single column.

## Test IDs

- `discover.greeting`, `discover.notifications`, `discover.avatar`, `discover.heroCta`, `discover.search`
- `discover.upcoming`
- `discover.cuisine.<cuisineId>`, `discover.collection.<collectionId>`
- `discover.spotlight`
- `discover.featured.<restaurantId>`, `discover.recommended.<restaurantId>`
- `favourite.<restaurantId>`: the favourite button on any restaurant card or detail.
- `notifications.item.<reservationId>`, `notifications.empty`

## Assumptions and open questions

- Assumption: the location line is fixed to Mumbai, since the catalog covers one city and the app doesn't request location access.
