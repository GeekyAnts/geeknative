---
id: reservation
title: Reservation
status:
  ios: planned
  android: planned
  web: planned
---

# Reservation

## Summary

Reserve a table in three elegant steps (details, preferences, review), modify an existing reservation with the same flow, and receive a confirmation that feels like a premium dining invitation.

## Screens and states

**Reserve** (`reserve(restaurantId, reservationId?)`, pushed). Background: the restaurant's hero image, blurred and darkened, fixed behind the content; content sits on `GlassSurface` panels (`glassStrong`, radius `xl`).

- **Header**: `TopBar` with back; restaurant name in serif `headline` in `onGlassOnImage`, and `reserve.title` (or `reserve.modifyTitle` when modifying) as overline in `accent`.
- **Progress**: three labelled segments (`reserve.step.details`, `reserve.step.preferences`, `reserve.step.review`) with a gold fill bar that animates between steps (gentle spring); accessibility value `reserve.stepPosition`. Tapping a completed step goes back to it.
- Steps change with a horizontal slide + fade (forward slides left, back slides right).

**Step 1 · Details** (one glass panel per group):

1. **Guests**: `reserve.guests` label; stepper with `minus` / `plus` `GlassIconButton`s (`reserve.removeGuest` / `reserve.addGuest`) around `reserve.guestCount` in serif `title`. Range 1 … `maxPartySize`; at the maximum, `plus` is disabled and `reserve.largeParty` shows in `caption`.
2. **Date**: `reserve.date` label with the selected month (`format.monthYear`) trailing; a horizontal strip of 30 date chips (`size.dateChipWidth` wide, radius `md`): short weekday (`date.weekdayShort.*`, or `reserve.today` / `reserve.tomorrow` for the first two) in `caption`, day number in serif `title`. Selected: `espresso` fill. Closed days are shown at 40% opacity but still selectable (they then show the closed message).
3. **Time**: `reserve.time` label; a wrapping grid of time chips (`format.time`), available ones as `Chip`s, unavailable ones struck through at 40% opacity and not tappable (accessibility label `reserve.slotUnavailable`). Messages instead of the grid: `reserve.closedDay` (closed) or `reserve.noSlots` (no available slots). Under the grid, `DemoNote` with `common.demoAvailabilityNote`.
4. Footer: `PrimaryButton` `common.continue`, enabled when a time is selected; tapping without a time shows `reserve.error.selectTime`.

**Step 2 · Preferences**:

1. **Seating** (`reserve.seating`): one large selectable tile per seating option the restaurant supports (`seating.<id>` + `seating<Id>` icon), single choice, two per row.
2. **Occasion** (`reserve.occasion`): chips for `none`, `birthday`, `anniversary`, `business`, `date`, `celebration` (`occasion.*` with `occasion<Id>` icons; `none` has no icon), single choice.
3. **Dietary** (`reserve.dietary`): chips for the six dietary options (`dietary.*`), multi-select.
4. **Notes** (`reserve.notes`): multi-line text field (placeholder `reserve.notesPlaceholder`), counter `reserve.notesCount` (max 280), `error` style and `reserve.error.notesTooLong` above 280.
5. Footer: `PrimaryButton` `common.continue`.

**Step 3 · Review**:

- `reserve.reviewTitle` in serif `title`; a summary card styled like a printed card (ivory `surface`, gold hairline border inset by `sm`, radius `lg`): restaurant thumbnail and name; rows for `reserve.summary.when` (long date + time), `reserve.summary.party` (guest count), `reserve.summary.seating`, `reserve.summary.occasion`, `reserve.summary.dietary` (comma-separated labels or `reserve.summary.none`), `reserve.summary.notes` (or `reserve.summary.none`). Each group has an `reserve.summary.edit` link to its step.
- `reserve.policy` in `caption`.
- Footer: `PrimaryButton` `reserve.confirm` (or `reserve.saveChanges` when modifying), busy while saving. Errors from saving show in an `error` banner above the button; `slotTaken` also returns to step 1 with the time cleared.

**Confirmation** (`confirmation(reservationId)`, replaces Reserve in the stack). On an `espresso` background with a faint gold radial glow:

1. Success animation: a gold circle outline draws itself, then a `check` scales in (gentle spring), then a soft gold ring pulse once; reduced motion shows the final state.
2. `confirmation.overline` overline (`accent`), `confirmation.title` in serif `hero` (`onEspresso`), `confirmation.body` with the restaurant name.
3. **The invitation card** (`surface` ivory, radius `lg`, gold inset hairline border, slight tilt-in on appear): restaurant photo strip at the top; restaurant name in serif `headline`; long date and time in serif italic `title`; a dashed divider; a two-column grid: guests, seating, occasion, dietary; notes if any; then `confirmation.code` overline and the code in a wide-tracked `subtitle`.
4. Actions row of three `GlassIconButton`-style labelled buttons: `confirmation.directions`, `confirmation.addToCalendar`, `confirmation.modify`; a text button `confirmation.cancel` in `error`-tinted `onEspresso`.
5. `PrimaryButton` (inverted: `accent` fill, `onAccent` text) `confirmation.done` → back to the screen before Reserve; text button `confirmation.viewReservations` → Reservations tab (Upcoming).

States (Reserve): loading → panel skeletons; restaurant not found → `EmptyState` as in spec/features/restaurant.md; modifying a reservation that isn't upcoming → `reservation.notFound.*` empty state. Confirmation for a missing reservation → `reservation.notFound.*`.

## Behavior and rules

### Defaults

- New reservation: party size = preferences `partySize` clamped to 1…`maxPartySize` (default 2); date = today; time = none; seating = preferences `seating` if the restaurant supports it, else the restaurant's first seating; occasion `none`; dietary = preferences `dietary`; notes empty.
- Book again (from Reservations): like a new reservation, but party size and seating from the old reservation.
- Modify: all fields from the reservation; its own slot shows as available even when demo availability says otherwise.
- Changing the date clears the time if that time isn't available on the new date.

### Reservation model and storage

`Reservation { id: String (UUID v4, lowercase), confirmationCode: String, restaurantId: String, date: "yyyy-MM-dd", time: "HH:mm", partySize: Int, seating: Seating, occasion: Occasion, dietary: [Dietary] (in the order listed in PRODUCT.md), notes: String, status: "confirmed" | "cancelled", createdAt: ISO 8601 UTC, updatedAt: ISO 8601 UTC }`

Stored as a JSON array under `reservations.<email>` (the member's lowercased email), newest `createdAt` first. `ReservationsRepository`: `list() -> [Reservation]`, `get(id) -> Reservation?`, `create(draft) -> Reservation`, `update(id, draft) -> Reservation`, `cancel(id) -> Reservation`, plus an observable stream (or query invalidation on web) so every screen updates. Implementations: local (`UserDefaultsReservationsRepository`, `DataStoreReservationsRepository`, `LocalStorageReservationsRepository`) and `InMemoryReservationsRepository`. Writes are serialized (one at a time) so two quick taps can't both pass the duplicate checks.

### Validation when saving (`ReservationValidator`, in this order)

1. Time selected, otherwise `selectTime`.
2. Notes ≤ 280 characters, otherwise `notesTooLong`.
3. The slot is still available by demo availability at save time (or is the reservation's own original slot when modifying), otherwise `slotTaken`.
4. No other **upcoming confirmed** reservation of the member has the same date and time (any restaurant), otherwise `duplicateTime`.
5. No other upcoming confirmed reservation of the member is at the same restaurant on the same date, otherwise `duplicateRestaurant`.

"Other" excludes the reservation being modified. Errors map to `reserve.error.*`; anything unexpected maps to `reserve.error.generic`.

### Confirmation code

`DC-` followed by 6 characters drawn at random from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, regenerated if it collides with one of the member's codes. Modifying keeps the code and id and updates `updatedAt`.

### Upcoming, past, cancelled

A reservation is **upcoming** when `status == confirmed` and its local date-time is after now; **past** when confirmed and not after now; **cancelled** when `status == cancelled`. Only upcoming reservations can be modified or cancelled.

### Confirmation actions

- Directions: as in spec/features/restaurant.md.
- Add to calendar: an event titled `calendar.eventTitle`, at the reservation's date and time, lasting 2 hours, location = the restaurant's address, notes `calendar.eventNotes`. iOS presents `EKEventEditViewController` (no permission needed on iOS 17); Android launches `Intent.ACTION_INSERT` on `CalendarContract.Events.CONTENT_URI`; web downloads `<confirmationCode>.ics` (VCALENDAR/VEVENT with floating local `DTSTART`/`DTEND`, `SUMMARY`, `LOCATION`, `DESCRIPTION`, `UID` = reservation id).
- Modify → Reserve with this reservation; Cancel → the cancel confirmation in spec/features/reservations.md, then Reservations (Cancelled).

## Acceptance criteria

- AC-reservation-1: Party size is limited to 1…maxPartySize, and the large-party message shows at the maximum.
- AC-reservation-2 (ui): Choosing a date shows that date's demo slots, with unavailable slots not selectable, and the closed message on closed days.
- AC-reservation-3: Continue from step 1 requires a time.
- AC-reservation-4: Saving creates a confirmed reservation with a `DC-` code of 6 allowed characters, stored under `reservations.<email>`.
- AC-reservation-5: Saving is rejected with `duplicateTime` when another upcoming reservation has the same date and time, and with `duplicateRestaurant` for the same restaurant on the same date.
- AC-reservation-6: Notes longer than 280 characters are rejected.
- AC-reservation-7 (ui): Confirming shows the Confirmation screen with the confirmation code, restaurant, date, time, guests and seating.
- AC-reservation-8: Modifying keeps the id and code, applies the changes, and doesn't conflict with the reservation's own slot.
- AC-reservation-9: Defaults come from dining preferences (party size, seating, dietary).
- AC-reservation-10: The calendar event has the documented title, start, 2-hour duration, location and notes.

## Copy

`reserve.*`, `seating.*`, `occasion.*`, `dietary.*`, `confirmation.*`, `calendar.*`, `common.continue`, `common.demoAvailabilityNote`, `format.*`.

## Platform notes

- Haptics on time selection and on confirmation success: iOS `.sensoryFeedback`, Android `HapticFeedback`, web none.

## Test IDs

- `reserve.title`, `reserve.progress`, `reserve.guests.decrease`, `reserve.guests.increase`, `reserve.guests.count`, `reserve.largeParty`
- `reserve.date.<yyyy-MM-dd>`, `reserve.time.<HH:mm>` (time chips; the colon is kept, e.g. `reserve.time.19:30`), `reserve.closed`, `reserve.noSlots`
- `reserve.seating.<seating>`, `reserve.occasion.<occasion>`, `reserve.dietary.<dietary>`, `reserve.notes`
- `reserve.continue`, `reserve.confirm`, `reserve.error`
- `confirmation.code`, `confirmation.restaurant`, `confirmation.directions`, `confirmation.addToCalendar`, `confirmation.modify`, `confirmation.cancel`, `confirmation.done`, `confirmation.viewReservations`

## Assumptions and open questions

- Assumption: a reservation lasts 2 hours for calendar purposes.
- Assumption: no deposits or payments in this version.
