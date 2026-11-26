---
id: trip-planner
title: Trip planner
status:
  ios: done
  android: done
  web: done
---

# Trip planner

## Summary

The traveler picks a destination, dates, travelers, budget and interests, then Wanderly generates a day-by-day itinerary from the catalog's hardcoded templates. The itinerary is photographic and editable: add, remove, reorder, complete, with a budget breakdown.

## User stories

- As a traveler, I want a full-day plan from a few choices so I am not staring at a blank calendar.
- As a traveler, I want to swap activities and tick them off so the plan becomes mine.

## Screens and states

**Trip planner** (form)

- Title: `planner.title`.
- Destination: required, picker of catalog destination names. Prefills from `destinationId` when present.
- Dates: start and end, required. Platform date pickers. Labels `planner.startDate`, `planner.endDate`. Dialog buttons use `common.done` / `common.cancel` / `common.ok` as the platform needs.
- Travelers: stepper 1–8, default from profile `defaultTravelers` or 2. Label `planner.travelers`.
- Budget: three choices, `budget.value` / `budget.mid` / `budget.luxury`, default from profile or `mid`.
- Interests: multi-select category chips, default from profile. May be empty.
- Primary action `planner.generate`.
- Validation messages: `planner.destinationError`, `planner.dateError`, `planner.rangeError` (more than 14 days).

**Itinerary** (`tripId`)

- Hero: destination cover, trip title (destination name), `itinerary.dates`, `itinerary.travelers`.
- Budget card: lodging, food, activities, total with `itinerary.budgetAmount`.
- Days in order: `itinerary.dayTitle`, platform-formatted date, then trip items.
- Each item: photograph, name, `itinerary.timeDuration`, summary, complete toggle, move up, move down, remove.
- Empty day: `itinerary.emptyDay` and `itinerary.add`.
- `itinerary.add` on each day opens a picker of catalog places for that destination not already on that day.
- `itinerary.saveTrip` sets status to `upcoming` if `endDate` is today or later, else `past`. Drafts stay drafts until this is tapped (generate creates `draft`).

## Behavior and rules

**Storage.** Key `trips.list`, JSON array of trips. Same keys on every platform.

```
Trip {
  id: string (UUID)
  destinationId: string
  title: string                 // destination name at generate time
  startDate: string             // YYYY-MM-DD
  endDate: string               // YYYY-MM-DD
  travelers: int                // 1–8
  budgetBand: "value" | "mid" | "luxury"
  interests: string[]           // category ids
  status: "draft" | "upcoming" | "past"
  days: [{
    dayIndex: int               // 1-based
    date: string                // YYYY-MM-DD
    items: [{
      id: string                // UUID
      placeId: string
      startTime: string         // HH:mm 24h
      durationMinutes: int
      completed: bool
    }]
  }]
}
```

**Generate** (deterministic, identical on every platform):

1. Validate destination, `endDate >= startDate`, `daysInclusive <= 14`.
2. `days = min(max(endDate - startDate + 1, 1), 7)` — itinerary length is at most 7 days even if the stay is longer (remaining calendar days are not given extra template days).
3. Load `destination.itineraryTemplates` (at least 3). For `d` in `0..<days`, `template = templates[d % templates.count]`.
4. Copy each template item onto that day with a new item UUID, `completed: false`, `startTime` and `durationMinutes` from the template. `date = startDate + d days`, `dayIndex = d + 1`.
5. If `interests` is non-empty, stable-sort each day's items so places whose `category` is in `interests` come first; never drop items.
6. Persist the trip with `status: "draft"` and open Itinerary.

**Budget** (integers, no cents):

```
estimates = destination.budgetEstimates[budgetBand]
lodging    = estimates.lodging * days
food       = estimates.food * days * travelers
activities = estimates.activities * days * travelers
total      = lodging + food + activities
```

`days` here is the itinerary day count from step 2.

**Edit**

- Add: append at 09:00 (or 18:00 if 09:00 is already used that day) with the place's `durationMinutes`.
- Remove: delete the item.
- Move up/down: swap with the adjacent item on the same day. Disabled at the ends.
- Complete: toggle `completed`. Completed items stay in place; draw a check and de-emphasize with `onSurfaceVariant`.
- Edits persist immediately to `trips.list`.

## Acceptance criteria

- AC-trip-planner-1: Generate requires a destination, start date and end date.
- AC-trip-planner-2: An end date before the start date shows `planner.dateError` and does not create a trip.
- AC-trip-planner-3: Generate creates one itinerary day per stay day (capped at 7), using the destination's templates.
- AC-trip-planner-4 (ui): Generate opens the Itinerary screen for the new trip.
- AC-trip-planner-5: Each itinerary item shows a photograph, name, start time and duration.
- AC-trip-planner-6: The traveler can add, remove, reorder (move up/down) and complete items; the change is still there after a restart.
- AC-trip-planner-7: The budget breakdown equals the lodging / food / activities formula for the chosen band, day count and travelers.

## Copy

Keys under `planner.*`, `itinerary.*`, `budget.*`, `common.done`, `common.cancel`, `common.ok`, `common.increase`, `common.decrease`.

## Platform notes

- iOS: date pickers in a sheet or graphical `DatePicker`; `common.done` to dismiss if presented in a toolbar. Planner is pushed; tab bar not in this stack if opened from City (Home tab stack).
- Android: Material date pickers; `common.ok` / `common.cancel`. Tab bar hidden.
- Web: `<input type="date">`; `/planner?destinationId=` and `/itinerary/$tripId`; Itinerary uses `Page width="full"`.

## Test IDs

- `planner.destination`
- `planner.startDate`
- `planner.endDate`
- `planner.travelers`
- `planner.budget.value` / `planner.budget.mid` / `planner.budget.luxury`
- `planner.interest.<category>`
- `planner.generate`
- `planner.dateError`
- `itinerary.hero`
- `itinerary.budget`
- `itinerary.day.<dayIndex>`
- `itinerary.item.<itemId>`
- `itinerary.complete.<itemId>`
- `itinerary.remove.<itemId>`
- `itinerary.moveUp.<itemId>`
- `itinerary.moveDown.<itemId>`
- `itinerary.add.<dayIndex>`
- `itinerary.saveTrip`

## Assumptions and open questions

- Stays longer than 7 days still store the full date range on the trip, but only 7 itinerary days are generated.
- Trip title is the destination name, not a custom name.
