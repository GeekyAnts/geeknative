---
id: reservations
title: Reservations
status:
  ios: planned
  android: planned
  web: planned
---

# Reservations

## Summary

Members manage their reservations: see upcoming, past and cancelled bookings, open the details, modify or cancel an upcoming one, and book a previous restaurant again.

## Screens and states

**Reservations** (`reservations`, tab root):

1. `ScreenHeader`: `reservations.subtitle` overline, `reservations.title` in serif `display`.
2. A segmented control of three glass pills: `reservations.tab.upcoming`, `.past`, `.cancelled`, each with its count; the selected pill is `espresso` and slides between options (snappy spring). Default Upcoming. Lists cross-fade when switching.
3. A list of **reservation cards** (`surface`, radius `lg`): the restaurant's hero photo as a strip on top (aspect 3:1) with a status pill top-leading (`reservations.status.confirmed` in `success`, `.completed` in `onSurfaceVariant` on `surfaceVariant`, `.cancelled` in `error`); then the restaurant name in serif `title`, `format.separator` of the short date and time in `subtitle`, guest count and seating in `caption`, the confirmation code in `caption` with tracking. Actions row:
   - Upcoming: `reservations.modify` (`edit`) and `reservations.cancel` (`cancelReservation`) as small secondary buttons.
   - Past and cancelled: `reservations.rebook` (`rebook`) as a small primary button.
   Tapping the card → Reservation detail.
4. Sorting: upcoming soonest first; past and cancelled most recent first (by date-time).

**Reservation detail** (`reservation(reservationId)`, pushed): `TopBar` with back and `reservation.title`; the restaurant hero photo (height `size.listImageHeight`, radius `xl`) with status pill; the same invitation card as Confirmation (spec/features/reservation.md, without the success animation); actions by status: upcoming → Directions, Add to calendar, Modify, Cancel; past/cancelled → `reservations.rebook` and `reservations.viewRestaurant`.

**Cancel confirmation** (native dialog): title `cancel.title`, message `cancel.body` (restaurant, short date, time), destructive `cancel.confirm`, cancel `cancel.keep`. Confirming sets `status` to `cancelled` and `updatedAt`, then the card moves to Cancelled with an animation.

States: loading → two card skeletons; error → `ErrorState`; empty per segment → `EmptyState`: upcoming (`calendar`, `reservations.empty.upcoming.title`, `.body`, button `reservations.empty.cta` → Discover tab), past (`clock`, `reservations.empty.past.*`), cancelled (`cancelReservation`, `reservations.empty.cancelled.*`). Reservation detail for a missing id → `EmptyState` (`reservation.notFound.title`, `.body`).

## Behavior and rules

- Data and the upcoming/past/cancelled rules come from spec/features/reservation.md.
- The lists update immediately after creating, modifying or cancelling anywhere in the app.
- Opening Reservations with Past selected (from Profile's history row) selects the Past segment.
- Book again → Reserve as specified in spec/features/reservation.md.

## Acceptance criteria

- AC-reservations-1: Reservations are grouped into upcoming, past and cancelled per the rules, sorted as specified.
- AC-reservations-2 (ui): Each segment shows its empty state when it has no reservations.
- AC-reservations-3 (ui): Cancelling an upcoming reservation after confirming the dialog moves it to Cancelled.
- AC-reservations-4: Cancelled and past reservations offer Book again, upcoming ones offer Modify and Cancel.
- AC-reservations-5 (ui): Tapping a reservation opens its detail with the confirmation code.

## Copy

`reservations.*`, `reservation.*`, `cancel.*`.

## Platform notes

- Segmented control is custom (glass pills) on every platform, per DESIGN.md.

## Test IDs

- `reservations.segment.upcoming`, `reservations.segment.past`, `reservations.segment.cancelled`
- `reservations.card.<reservationId>`, `reservations.modify.<reservationId>`, `reservations.cancel.<reservationId>`, `reservations.rebook.<reservationId>`
- `reservations.empty`
- `reservation.code`, `reservation.notFound`
- `cancel.confirm`, `cancel.keep` (not on iOS: the native dialog's buttons are found by label)

## Assumptions and open questions

- Assumption: the reservation card's photo strip is the restaurant's hero image at a 3:1 aspect ratio.
