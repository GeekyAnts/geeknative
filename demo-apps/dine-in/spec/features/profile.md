---
id: profile
title: Profile
status:
  ios: planned
  android: planned
  web: planned
---

# Profile

## Summary

The member's corner: their profile and club stats, dining preferences that personalise Discover and pre-fill reservations, reminders, settings, help and sign out.

## Screens and states

**Profile** (`profile`, tab root):

1. **Member card** (an `espresso` card, radius `xl`, with a faint gold diagonal sheen and a gold hairline inset border — a members' card): avatar (`size.avatarLarge`, `accent` ring, initials in serif `display`), name in serif `headline` (`onEspresso`), email in `caption`, `profile.membership` overline in `accent`, and `profile.memberSince` with `format.monthYear` of `createdAt`.
2. **Stats** row of three glass tiles: `profile.stats.upcoming` (upcoming count), `profile.stats.dined` (past count), `profile.stats.saved` (saved count); numbers in serif `headline`.
3. **Rows** in a `surface` card (each `size.touchTarget`+ tall, leading icon in an `accent` circle, trailing `chevronRight`):
   - `profile.savedRestaurants` (`heart`) → Saved tab
   - `profile.preferences` (`utensils`) → Dining preferences
   - `profile.history` (`clock`) → Reservations tab with Past selected
   - `profile.notifications` (`bell`) with `profile.notificationsBody` subtitle and a trailing switch instead of the chevron
   - `profile.settings` (`settings`) → Settings
   - `profile.help` (`help`) → Help & support
4. `profile.signOut` (`signOut`) as a full-width `SecondaryButton` in `error` → native confirmation (`profile.signOutConfirm.title`, `.body`, destructive `profile.signOut`, `common.cancel`) → signs out (spec/features/auth.md).
5. App version caption: `settings.about.version`.

**Dining preferences** (`preferences`, pushed): `TopBar` with back; `ScreenHeader` (`preferences.title`, `preferences.subtitle`); glass panels: `preferences.cuisines` (cuisine chips, multi), `preferences.dietary` (dietary chips, multi), `preferences.seating` (seating chips for all four, single), `preferences.partySize` (stepper 1…12 showing `reserve.guestCount`). Changes save immediately (no save button).

**Help & support** (`help`, pushed): `TopBar`; `ScreenHeader` `help.title`; `help.body`; two action rows: `help.email` (`mail`, shows `help.emailAddress`, opens `mailto:`) and `help.call` (`phone`, shows `help.phoneNumber`, opens `tel:`); `help.faq.title` with three expandable FAQ items (`help.faq.modify.*`, `help.faq.cancel.*`, `help.faq.demo.*`), expanding with a snappy spring and a rotating `chevronDown`.

States: Profile shows skeleton stats while loading; if its data fails to load, the whole screen shows `ErrorState` with retry.

## Behavior and rules

- `DiningPreferences { cuisines: [CuisineId], dietary: [Dietary], seating: Seating, partySize: Int, reminders: Bool }`, default `{ cuisines: [], dietary: [], seating: indoor, partySize: 2, reminders: true }`. Stored as JSON under `preferences.<email>`. Unknown values are dropped; a missing or invalid object means the defaults.
- `PreferencesRepository`: `load() -> DiningPreferences`, `save(DiningPreferences)`, observable. Implementations: local (`UserDefaultsPreferencesRepository`, `DataStorePreferencesRepository`, `LocalStoragePreferencesRepository`) and `InMemoryPreferencesRepository`.
- Initials: first letter of the first and last words of the name, uppercased (one letter for a one-word name).
- The reminders switch writes `reminders`; Notifications and Discover's bell dot respect it.

## Acceptance criteria

- AC-profile-1 (ui): Profile shows the member's name, email and stats (upcoming, dined, saved).
- AC-profile-2: Preferences default as specified and persist after restart.
- AC-profile-3: Changing preferences updates Discover's Recommended row and the defaults of a new reservation.
- AC-profile-4 (ui): Sign out asks for confirmation, then shows Welcome.
- AC-profile-5 (ui): Profile's Settings row opens Settings.
- AC-profile-6: Initials are computed from the first and last words of the name.

## Copy

`profile.*`, `preferences.*`, `help.*`, `settings.about.version`, `common.cancel`.

## Platform notes

- Switch: native on each platform (iOS `Toggle`, Android `Switch`, web `input type="checkbox" role="switch"`), tinted `espresso`.

## Test IDs

- `profile.name`, `profile.email`, `profile.stats.upcoming`, `profile.stats.dined`, `profile.stats.saved`
- `profile.savedRestaurants`, `profile.preferences`, `profile.history`, `profile.reminders`, `profile.settings`, `profile.help`, `profile.signOut`
- `preferences.cuisine.<cuisineId>`, `preferences.dietary.<dietary>`, `preferences.seating.<seating>`, `preferences.partySize.decrease`, `preferences.partySize.increase`, `preferences.partySize.count`
- `help.email`, `help.call`, `help.faq.<id>` (`modify`, `cancel`, `demo`)

## Assumptions and open questions

- Assumption: editing name or email is out of scope for this version.
