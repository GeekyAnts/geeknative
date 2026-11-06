---
id: packages
title: Packages
status:
  ios: done
  android: done
  web: done
---

# Packages

## Summary

Couples compare Intimate, Grand, Royal Luxury and Bespoke starting points, tailor guest count and add-ons, and see a live category-wise budget.

## User stories

- As a couple, I want to choose a wedding package so that our plan has a clear starting composition.
- As a couple, I want a live budget breakdown so that venue, catering and experiences stay in proportion.

## Screens and states

**Packages**

- Title `packages.title` and `packages.body`.
- Four package cards from the catalog.
- Guest count control.
- Optional experience add-ons from the catalog.
- Budget breakdown: venue, accommodation, catering, decoration, photography, experiences, total.
- Primary action `packages.selectCta` saves the package to the wedding plan.

No loading or error. Empty add-ons are valid (zero experiences).

## Behavior and rules

- Catalog package ids: `intimate`, `grand`, `royal`, `bespoke`.
- Budget total = package `basePrice` + max(0, guests − package `includedGuests`) × package `extraGuestPrice` + sum of selected experience `priceFrom`.
- Category amounts are the package's named shares, with catering increased by extra guests and experiences as their own line.
- Selecting a package writes `packageId`, `guestCount` and `selectedExperienceIds` to the wedding plan, and `budget` to the computed total.
- Guest count minimum 2, maximum 500.

## Acceptance criteria

- AC-packages-1: Packages shows Intimate, Grand, Royal Luxury and Bespoke.
- AC-packages-2: Changing guest count updates the displayed total.
- AC-packages-3: Selecting a package stores its id on the wedding plan.

## Copy

Keys under `packages.*` in contracts/strings.

## Platform notes

- Web lists Packages in the header. iOS and Android push this screen from Home, Wedding, and the Plan CTA.

## Test IDs

- `packages.list`: package cards.
- `packages.card.<id>`: a package card.
- `packages.guests`: guest count control.
- `packages.total`: computed total.
- `packages.selectCta`: select package.
- `packages.breakdown`: category breakdown.

## Assumptions and open questions

- Prices are sample USD estimates, not quotes.
