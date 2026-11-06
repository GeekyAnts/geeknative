---
id: home
title: Home
status:
  ios: done
  android: done
  web: done
---

# Home

## Summary

The first screen is a cinematic landing: a full-bleed destination photograph, the brand promise, a glass search panel, and editorial featured destinations that open the rest of the concierge.

## User stories

- As a couple, I want to feel the destination wedding the moment I open the app so that planning starts as a dream, not a form.
- As a couple, I want to search by place, date, guests and budget so that Destinations opens already filtered.
- As a couple, I want to jump into Destinations or My Wedding from the hero so that I can explore or start planning immediately.

## Screens and states

**Home**

- The brand name from contracts/app.json is visible in the navigation chrome.
- Hero headline `home.heroTitle` and supporting text `home.heroBody`.
- Primary CTA `home.exploreCta` opens Destinations.
- Secondary CTA `home.planCta` opens Wedding.
- A glass search panel with location, date, guests and budget, submitted with `home.search.submit`.
- Featured destinations from the catalog (Udaipur, Goa, Jaipur, Bali, Tuscany, Santorini), each with a photograph, name, short description and `home.exploreDestination`.
- Settings entry `home.openSettings`.
- Catalog photography is remote sample imagery. A missing image still shows the destination name on a `surfaceVariant` field.
- Static chrome plus catalog data: no loading spinner. An empty catalog is not a product state.

## Behavior and rules

- Submitting search writes `searchLocation`, `searchDate`, `searchGuests` and `searchBudget` on the WeddingPlan, then opens Destinations with those filters applied.
- Tapping a featured destination opens Destination detail for that id.
- Guest and budget fields accept integers. Invalid or empty values are stored as 0 and ignored by filters.

## Acceptance criteria

- AC-home-1: Home shows the app name in its navigation chrome.
- AC-home-2: Home shows the hero title and supporting text.
- AC-home-3 (ui): Home has an entry point that opens Settings.
- AC-home-4 (ui): Explore Destinations opens Destinations.
- AC-home-5 (ui): Plan Your Wedding opens Wedding.
- AC-home-6: Home lists the featured destinations from the catalog.
- AC-home-7 (ui): Submitting the search panel opens Destinations.

## Copy

Keys under `home.*` and `nav.*` in contracts/strings.

## Platform notes

- iOS: Home sits in the Home tab with a transparent bar over the hero. The Settings gear is a toolbar button. Packages is not a tab.
- Android: transparent top app bar over the hero; Settings is an app-bar action.
- Web: the site header is glass over the hero on Home and is the only place the app name appears (the hero does not repeat it). Settings is a gear link in that header, on every page. Below the large breakpoint, a control drops a navigation panel. Home content is full-bleed; the shell does not add page padding.

## Test IDs

- `home.openSettings`: the Settings entry point.
- `nav.menuToggle`: opens and closes the compact web navigation panel.
- `nav.menu`: the dropped navigation panel on compact viewports.
- `home.exploreCta`: Explore Destinations.
- `home.planCta`: Plan Your Wedding.
- `home.search`: the search panel.
- `home.search.submit`: submit search.
- `home.featured`: featured destinations list.
- `home.destination.<id>`: a featured destination card.

## Assumptions and open questions

- AC-home-3, AC-home-4, AC-home-5 and AC-home-7 are (ui) criteria. iOS covers them with XCUITests; Android with Compose UI tests; web by rendering into happy-dom.
- Featured photography uses Unsplash sample URLs in `WeddingCatalog`.
