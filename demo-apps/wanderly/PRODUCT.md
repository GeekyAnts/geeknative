# Product

## In one sentence

Wanderly is a premium, image-first travel discovery and trip-planning app that helps curious travelers find destinations, save places, and build beautiful day-by-day itineraries.

## Who it's for

Independent travelers and small groups who plan trips visually — people who choose a city from a photograph, then want attractions, hotels, restaurants and a realistic itinerary in one place.

## Features

| Feature | Spec | Summary |
|---|---|---|
| Home | [spec/features/home.md](spec/features/home.md) | Search, featured destination, trending cities, categories and popular places |
| Explore | [spec/features/explore.md](spec/features/explore.md) | Search and filter destinations and places |
| City details | [spec/features/city-details.md](spec/features/city-details.md) | City story, travel facts, attractions, hotels, restaurants, activities and tips |
| Place details | [spec/features/place-details.md](spec/features/place-details.md) | Attraction, hotel, restaurant or activity with photos, facts, save and add-to-trip |
| Trip planner | [spec/features/trip-planner.md](spec/features/trip-planner.md) | Plan a trip and generate an editable day-by-day itinerary |
| My trips | [spec/features/my-trips.md](spec/features/my-trips.md) | Upcoming, past and draft itineraries |
| Saved | [spec/features/saved.md](spec/features/saved.md) | Saved destinations and places |
| Profile | [spec/features/profile.md](spec/features/profile.md) | Traveler profile, preferences and a path to Settings |
| Settings | [spec/features/settings.md](spec/features/settings.md) | Appearance (System, Light, Dark) and app version |

## Platforms

| Platform | Built with | Minimum |
|---|---|---|
| iOS | SwiftUI | iOS 17 |
| Android | Kotlin, Jetpack Compose | Android 7.0 (API 24) |
| Web | React, TanStack Start | Safari 16.4, Chrome 111, Firefox 128 |

**Consistency:** `strict` in `contracts/app.json`. Same features, screens and behavior on every platform; `n/a` is never allowed.

## Glossary

Domain terms, defined once. Code uses these exact names on every platform.

| Term | Meaning |
|---|---|
| Destination | A city or region the traveler can visit (Paris, Bali, …). |
| Place | An attraction, hotel, restaurant or activity in a destination. |
| Kind | The type of a place: `attraction`, `hotel`, `restaurant` or `activity`. Destinations use kind `destination` when saved. |
| Category | A travel mood used to browse: `beaches`, `mountains`, `adventure`, `history`, `food`. |
| Catalog | The bundled mock dataset in `contracts/catalog.json` (destinations, places, itinerary templates). |
| Trip | A planned visit: destination, dates, travelers, budget band, interests and itinerary days. |
| Itinerary | The day-by-day list of trip items generated from catalog templates and then edited. |
| Trip item | One scheduled place on a day, with start time, duration and a completed flag. |
| Budget band | `value`, `mid` or `luxury` — used to estimate lodging, food and activities. |
| Saved item | A destination or place the traveler bookmarked. |

## Photographs

Destination and place photos come from [Unsplash](https://unsplash.com/license). The catalog stores each image as an `images.unsplash.com` URL (`scripts/build-catalog.mjs` writes `contracts/catalog.json`). The Unsplash License allows those photos on a public site.

## Out of scope

- Live booking, payments, maps SDKs and weather APIs (weather is mock data in the catalog)
- User accounts, social features and reviews
- A real backend — repositories stay local
