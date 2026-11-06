# Product

## In one sentence

The Dining Club is a luxury dining concierge: members discover Mumbai's most exceptional restaurants, explore their food and ambience, and reserve a table in a few elegant steps.

## Who it's for

Discerning diners who treat a restaurant booking as the start of an evening: couples planning a special night, hosts arranging a business dinner, travellers looking for the city's best tables. They expect the polish of a five-star hotel app, not a food-delivery directory.

## Features

| Feature | Spec | Summary |
|---|---|---|
| Authentication | [spec/features/auth.md](spec/features/auth.md) | Welcome, sign in, create account, sign out (accounts stored on the device) |
| Catalog | [spec/features/catalog.md](spec/features/catalog.md) | The demonstration restaurant catalog, demo availability rules and shared formatting |
| Discover | [spec/features/discover.md](spec/features/discover.md) | Editorial home: greeting, hero, search entry, cuisines, collections, featured restaurants, notifications |
| Explore | [spec/features/explore.md](spec/features/explore.md) | Search, filter, sort, grid or list of every restaurant |
| Restaurant | [spec/features/restaurant.md](spec/features/restaurant.md) | Immersive restaurant profile with gallery, details, dishes, reviews and Reserve |
| Reservation | [spec/features/reservation.md](spec/features/reservation.md) | Three-step reservation flow, modify, and the confirmation "invitation" |
| Reservations | [spec/features/reservations.md](spec/features/reservations.md) | Upcoming, past and cancelled reservations; details, modify, cancel, book again |
| Saved | [spec/features/saved.md](spec/features/saved.md) | Favourite restaurants |
| Profile | [spec/features/profile.md](spec/features/profile.md) | Member profile, dining preferences, reminders, help and sign out |
| Settings | [spec/features/settings.md](spec/features/settings.md) | Appearance (System, Light, Dark) and app version |

## Platforms

| Platform | Built with | Minimum |
|---|---|---|
| iOS | SwiftUI | iOS 17 |
| Android | Kotlin, Jetpack Compose | Android 7.0 (API 24) |
| Web | React, TanStack Start | Safari 16.4, Chrome 111, Firefox 128 |

**Consistency Target:** strict (`contracts/app.json`): the same screens, layouts and flows on all three platforms.

## Glossary

Domain terms, defined once. Code uses these exact names on every platform.

| Term | Meaning |
|---|---|
| Restaurant | A venue in the catalog (`Restaurant`), identified by a kebab-case `id` such as `maison-lumiere` |
| Catalog | The bundled list of restaurants, cuisines and collections (`Catalog`, read through `CatalogRepository`) |
| Cuisine | One of `italian`, `japanese`, `indian`, `french`, `mediterranean`, `asian`, `continental` |
| Collection | An editorial grouping of restaurants (`mostLoved`, `fineDining`, `romantic`, `rooftop`, `hiddenGems`, `chefsPicks`) |
| Slot | A reservable time on a date at a restaurant (`Slot`: `time` "HH:mm", `available`) |
| Demo availability | The deterministic rule that decides which slots are open, clearly labelled as demonstration data |
| Reservation | A booking the member made (`Reservation`), with a `confirmationCode` like `DC-7KQ2MX` |
| Party size | The number of guests on a reservation |
| Seating | `indoor`, `outdoor`, `window` or `private` |
| Occasion | `none`, `birthday`, `anniversary`, `business`, `date`, `celebration` |
| Dietary | `vegetarian`, `vegan`, `glutenFree`, `dairyFree`, `nutAllergy`, `shellfishAllergy` |
| Saved | A restaurant the member marked as a favourite |
| Member | The signed-in user (`Account`), identified by email |
| Preferences | The member's dining preferences (`DiningPreferences`) |

## Out of scope

- A real backend, payments, deposits and live restaurant availability (everything reads and writes through repositories with local implementations; the catalog and availability are demonstration data).
- Social sign-in, password reset and email verification.
- Push notifications (reminders are shown in the app only).
- Restaurant-side tools and reviews written by members.
