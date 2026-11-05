---
id: catalog
title: Catalog
status:
  ios: planned
  android: planned
  web: planned
---

# Catalog

## Summary

The restaurant catalog every screen reads, the demonstration availability rule that decides which reservation slots are open, and the shared formatting of dates, times, prices and ratings. No screens of its own.

## Behavior and rules

### Source

- The canonical catalog is `contracts/catalog.json`. `make assets` copies it to `apps/ios/App/Resources/catalog.json`, `apps/android/app/src/main/assets/catalog.json` and `apps/web/src/data/catalog.json`. Never edit the copies.
- Read through `CatalogRepository` with one method, `load() -> Catalog` (async, throws). Implementations: `BundledCatalogRepository` (parses the bundled file once and caches the result) and `InMemoryCatalogRepository` (tests and previews). A future backend adds `RemoteCatalogRepository`; nothing else changes.
- All content in the catalog (names, descriptions, reviews, prices) is fictional demonstration data. It is content, not UI copy, so it is not in contracts/strings.

### Model (field names identical on every platform)

`Catalog { version: Int, heroImage: String, welcomeImage: String, cuisines: [CuisineId], collections: [Collection], restaurants: [Restaurant] }`

`Collection { id: CollectionId, image: String }`; title and subtitle come from strings `collection.<id>.title` / `.subtitle`.

`Restaurant { id, name, cuisine: CuisineId, neighbourhood, address, phone, latitude: Double, longitude: Double, distanceKm: Double, rating: Double, reviewCount: Int, priceLevel: Int (1–4), costForTwo: Int (INR), tagline, about, ambience, dressCode: String?, featured: Bool, collections: [CollectionId], amenities: [AmenityId], seating: [Seating], maxPartySize: Int, demandPercent: Int (0–100), openingHours: { mon…sun: { open: "HH:mm", close: "HH:mm" } | null }, heroImage, gallery: [String], signatureDishes: [Dish], menuHighlights: [MenuItem], reviews: [Review] }`

`Dish { name, description, price: Int, image }`, `MenuItem { name, description, price: Int }`, `Review { author, rating: Int, date: "yyyy-MM-dd", text }`.

Enums: `CuisineId` = italian, japanese, indian, french, mediterranean, asian, continental. `CollectionId` = mostLoved, fineDining, romantic, rooftop, hiddenGems, chefsPicks. `AmenityId` = valet, sommelier, privateDining, liveMusic, rooftop, accessible, bar, chefsTable, garden, wifi (label `amenity.<id>`, icon `amenity<Id>` e.g. `amenityPrivateDining`, `amenityAccessible`, `amenityGarden`). `Seating` = indoor, outdoor, window, private (label `seating.<id>`, icon `seating<Id>`).

Unknown enum values in the file are skipped (an unknown amenity is dropped; a restaurant with an unknown cuisine is dropped), so an older app keeps working with a newer catalog.

### Demo availability

`DemoAvailability.slots(restaurant, date, now) -> [Slot]` where `Slot { time: "HH:mm", available: Bool }`. Pure function; `now` is injected (a clock) so tests are deterministic. All times are the device's local time.

1. Weekday of `date` → `openingHours[mon…sun]`. `null` → the day is **closed**: return no slots and report `closed`.
2. Slots run every 30 minutes from `open` to `close − 90 minutes` inclusive. A `close` at or before `open` (for example `00:00`) means the next day, so `17:30–00:00` gives 17:30 … 22:30. Times past midnight wrap (`24:30` → `00:30`).
3. If `date` is today, drop slots that start less than 60 minutes after `now`.
4. A slot is unavailable when `fnv1a32("<restaurantId>|<yyyy-MM-dd>|<HH:mm>") % 100 < demandPercent`, otherwise available. `fnv1a32` is 32-bit FNV-1a over the UTF-8 bytes: start with `0x811C9DC5`; for each byte, XOR it in, then multiply by `0x01000193` modulo 2³².
5. Bookable dates are today through today + 29 days.

`DemoAvailability.today(restaurant, now) -> available | full | closed`: closed if today is closed; available if any of today's remaining slots is available; otherwise full (including when no slots remain today).

Every screen that shows availability shows the `DemoNote` with `common.demoAvailabilityNote` nearby (DESIGN.md), so demonstration availability is never presented as live.

Test vectors (`demandPercent` from the catalog, `now` well before the date):

| Restaurant | Date | Slots (✓ available, ✗ unavailable) |
|---|---|---|
| maison-lumiere | 2026-11-20 (Fri) | 19:00✓ 19:30✓ 20:00✓ 20:30✓ 21:00✗ 21:30✗ 22:00✓ |
| koyo | 2026-11-20 (Fri) | 18:30✗ 19:00✗ 19:30✗ 20:00✗ 20:30✗ 21:00✗ 21:30✓ |
| bistro-sept | 2026-12-05 (Sat) | 18:00✓ 18:30✓ 19:00✗ 19:30✓ 20:00✗ 20:30✓ 21:00✓ 21:30✓ |
| maison-lumiere | 2026-11-23 (Mon) | closed |

`fnv1a32("a") = 3826002220`; `fnv1a32("koyo|2026-11-20|19:00") = 4177624537`.

### Formatting (`Formatters`, identical output everywhere)

Built from strings, not from platform locale formatters, so all three apps print exactly the same text.

- Short date: `format.dateShort` with `date.weekdayShort.<mon…sun>`, day number, `date.monthShort.<jan…dec>` → "Fri, 20 Nov".
- Long date: `format.dateLong` with `date.weekday.*`, day, `date.month.*`, year → "Friday, 20 November 2026".
- Time from "HH:mm": `format.time` with hour on a 12-hour clock (0 → 12), minute as two digits, period `format.am` (00:00–11:59) or `format.pm` → "7:30 PM", "12:00 AM".
- Price: `format.price` with the amount grouped Indian-style (last three digits, then pairs: 2400 → "2,400", 125000 → "1,25,000") → "₹2,400".
- Price level symbol: the text of `format.price` with an empty amount ("₹").
- Rating: one decimal with a "." separator → "4.9", "5.0".
- Distance: `restaurant.distance` with one decimal → "1.2 km".
- Date-time strings stored in data use ISO 8601 (`yyyy-MM-dd`, `HH:mm`, and full timestamps in UTC with `Z`).

### Search text matching

`matches(text, query)`: both sides lowercased and folded to remove diacritics (`Kōyō` matches `koyo`, `Lumière` matches `lumiere`), query trimmed; an empty query matches everything; otherwise the folded text contains the folded query.

## Acceptance criteria

- AC-catalog-1: The bundled catalog loads with 10 restaurants, 7 cuisines and 6 collections.
- AC-catalog-2: Demo availability returns exactly the slots in the test-vector table, including a closed day.
- AC-catalog-3: On today's date, slots starting less than 60 minutes from now are not returned.
- AC-catalog-4: `fnv1a32` returns the documented values.
- AC-catalog-5: Formatters produce "Fri, 20 Nov", "Friday, 20 November 2026", "7:30 PM", "12:00 AM", "₹2,400", "₹1,25,000" and "4.9".
- AC-catalog-6: Search matching ignores case and diacritics.
- AC-catalog-7: Today's availability is closed, full or available per the rules.

## Copy

`format.*`, `date.*`, `cuisine.*`, `collection.*`, `amenity.*`, `seating.*`, `restaurant.distance`, `common.demoAvailabilityNote`, `common.demoBadge`.

## Platform notes

- iOS decodes with `JSONDecoder`; Android with kotlinx-serialization-json (add the runtime library; the plugin is already in libs.versions.toml); web imports the JSON module.

## Test IDs

- `demoNote`: the demonstration-data note.

## Assumptions and open questions

- Assumption: one city (Mumbai). `distanceKm` is a fixed demonstration distance from the member, since the app doesn't use location services.
- Assumption: availability doesn't depend on party size or seating, beyond `maxPartySize`.
