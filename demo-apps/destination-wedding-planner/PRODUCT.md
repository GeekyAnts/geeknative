# Product

## In one sentence

ORLÈVE is a luxury destination wedding concierge: couples discover extraordinary places, choose exclusive venues, compose a bespoke celebration, and manage every arrangement with the calm of a private atelier.

## Who it's for

Couples planning an intimate or grand destination wedding — and the families who help them — who want an editorial, hospitality-grade experience rather than a generic booking site.

## Features

| Feature | Spec | Summary |
|---|---|---|
| Home | [spec/features/home.md](spec/features/home.md) | Cinematic landing, destination search, and featured destinations |
| Destinations | [spec/features/destinations.md](spec/features/destinations.md) | Browse and filter wedding destinations by style, guests, and budget |
| Venues | [spec/features/venues.md](spec/features/venues.md) | Discover venues, view details, save favourites, and send enquiries |
| Experiences | [spec/features/experiences.md](spec/features/experiences.md) | Arrange photography, florals, catering, and other wedding services |
| Packages | [spec/features/packages.md](spec/features/packages.md) | Customisable wedding packages with a live budget breakdown |
| Wedding | [spec/features/wedding.md](spec/features/wedding.md) | Personal planning dashboard, countdown, checklist, and saved places |
| Settings | [spec/features/settings.md](spec/features/settings.md) | Appearance (System, Light, Dark) and app version |

## Platforms

| Platform | Built with | Minimum |
|---|---|---|
| iOS | SwiftUI | iOS 17 |
| Android | Kotlin, Jetpack Compose | Android 7.0 (API 24) |
| Web | React, TanStack Start | Safari 16.4, Chrome 111, Firefox 128 |

**Consistency:** `strict` in `contracts/app.json`. Same screens and behavior on every platform; native controls and navigation chrome.

## Glossary

Domain terms, defined once. Code uses these exact names on every platform.

| Term | Meaning |
|---|---|
| Destination | A wedding region (for example Udaipur or Tuscany) with a style, season, capacity, and budget range |
| Venue | A specific palace, resort, villa, or hotel that can host the wedding |
| WeddingStyle | Beach, Royal, Garden, Mountain, Heritage, or Luxury Resort |
| Experience | An additional service such as photography, florals, catering, or live music |
| WeddingPackage | A starting celebration — Intimate, Grand, Royal Luxury, or Bespoke — that can be tailored |
| WeddingPlan | The couple's saved date, destination, venue, guests, budget, package, checklist, and wishlist |
| Enquiry | A request to the concierge about a venue or experience |
| BookingStatus | `none`, `enquirySent`, or `confirmed` |

## Out of scope

- Real payments and live inventory from hotels
- Account creation, authentication, and multi-device sync
- Live maps SDKs (venues show location text and open the system map)
- Vendor messaging beyond a locally stored enquiry
