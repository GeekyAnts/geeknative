---
id: venues
title: Venues
status:
  ios: done
  android: done
  web: done
---

# Venues

## Summary

Couples discover palaces, resorts and villas, open an immersive venue page, save favourites, and send a concierge enquiry.

## User stories

- As a couple, I want to browse venues with photography, capacity and price so that I can shortlist a setting.
- As a couple, I want to enquire about a venue so that the concierge can follow up.
- As a couple, I want to save a venue so that it appears on My Wedding.

## Screens and states

**Venues**

- Title `venues.title`.
- Filters: destination, guest capacity, budget.
- Cards: photograph, name, destination, capacity, from-price, rating.
- Empty: `venues.emptyTitle` and `venues.emptyBody`.

**Venue detail**

- Gallery, name, destination, description, highlights, capacity, spaces, accommodation, amenities, from-price, packages, reviews, location (name plus coordinates).
- Glass booking panel with `venues.enquireCta`.
- Save control.

**Enquiry**

- Fields: couple name, email, date, guests, message.
- Submit `venues.enquireSubmit`. Success `venues.enquireSuccess`.
- Validation: name, email and message are required. Email must contain `@`.

## Behavior and rules

- Guest filter: `capacity >= guests` when guests > 0.
- Budget filter: `priceFrom <= budget` when budget > 0.
- Destination filter: exact destination id, or all.
- Enquire saves an `Enquiry` to `wedding.enquiries` and sets `WeddingPlan.bookingStatus` to `enquirySent` and `venueId` to that venue.
- Save toggles `savedVenueIds`.
- Opening the map uses the platform's geo URL with the venue's latitude and longitude.
- Catalog venue ids: `udaipur-taj-lake`, `udaipur-leela`, `goa-taj-exotica`, `jaipur-rambagh`, `jaipur-rajmahal`, `bali-bulgari`, `tuscany-castello`, `santorini-canaves`.

## Acceptance criteria

- AC-venues-1: Venues shows every catalog venue when no filter is applied.
- AC-venues-2: Filtering by destination shows only that destination's venues.
- AC-venues-3: Venue detail shows capacity, from-price and amenities.
- AC-venues-4 (ui): Submitting a valid enquiry shows the success message.
- AC-venues-5: Saving a venue adds its id to the wedding plan's saved venues.

## Copy

Keys under `venues.*` in contracts/strings.

## Platform notes

- Enquiry is a sheet on iOS, a dialog on Android, and a `<dialog>` on web.
- Map: iOS `maps:`, Android geo intent, web `https://maps.google.com/?q=lat,lng`.

## Test IDs

- `venues.list`: venue results.
- `venues.filter.destination`: destination filter.
- `venues.card.<id>`: a venue card.
- `venues.enquireCta`: open enquiry.
- `venues.enquireForm`: enquiry form.
- `venues.enquireSubmit`: submit enquiry.
- `venues.enquireSuccess`: success message.
- `venues.save`: save control.
- `venues.map`: open map.

## Assumptions and open questions

- Enquiry is stored only on device. There is no email send.
- Reviews are sample catalog data.
