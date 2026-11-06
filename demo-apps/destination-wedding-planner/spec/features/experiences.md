---
id: experiences
title: Experiences
status:
  ios: done
  android: done
  web: done
---

# Experiences

## Summary

Couples explore photography, florals, catering and the other services that complete a destination wedding, and send an enquiry to add them to the plan.

## User stories

- As a couple, I want to browse wedding services as premium cards so that I can compose the celebration beyond the venue.
- As a couple, I want to enquire about a service so that it is attached to our wedding plan.

## Screens and states

**Experiences**

- Title `experiences.title` and supporting `experiences.body`.
- One card per catalog experience: photograph, name, description, from-price, `experiences.enquireCta`.
- Enquiry uses the same fields as venues (name, email, date, guests, message) with success `experiences.enquireSuccess`.

No loading, empty or error states: the catalog always has the ten services.

## Behavior and rules

- Enquire stores an `Enquiry` with `experienceId`, and adds that id to `WeddingPlan.selectedExperienceIds` if it is not already there.
- Catalog ids: `photography`, `florals`, `catering`, `planner`, `makeup`, `entertainment`, `accommodation`, `transport`, `prewedding`, `rituals`.

## Acceptance criteria

- AC-experiences-1: Experiences shows every catalog service.
- AC-experiences-2: Submitting a valid experience enquiry records it and selects that experience on the wedding plan.

## Copy

Keys under `experiences.*` in contracts/strings.

## Platform notes

- Enquiry presentation matches Venues (sheet / dialog / `<dialog>`).

## Test IDs

- `experiences.list`: service cards.
- `experiences.card.<id>`: a service card.
- `experiences.enquireCta.<id>`: enquire on a service.
- `experiences.enquireForm`: enquiry form.
- `experiences.enquireSubmit`: submit.
- `experiences.enquireSuccess`: success.

## Assumptions and open questions

- Services are arranged as enquiries, not instant bookings.
