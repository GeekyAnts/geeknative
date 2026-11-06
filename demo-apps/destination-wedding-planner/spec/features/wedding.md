---
id: wedding
title: Wedding
status:
  ios: done
  android: done
  web: done
---

# Wedding

## Summary

My Wedding is the couple's atelier: countdown, chosen destination and venue, budget and guests, booking status, a planning timeline, upcoming tasks, and saved places.

## User stories

- As a couple, I want a countdown to our date so that the wedding stays present.
- As a couple, I want a checklist of planning tasks so that I can see progress.
- As a couple, I want my saved destinations and venues in one place so that shortlists are not lost.

## Screens and states

**Wedding**

- Title `wedding.title`.
- If `date` is set: countdown `wedding.countdown` with days remaining (0 if the date is today or past).
- If `date` is missing: `wedding.noDateTitle` and a date field.
- Selected destination and venue names, or `wedding.noDestination` / `wedding.noVenue` with links to those screens.
- Guest count and budget editors.
- Booking status label from `wedding.status.*`.
- Progress: completed tasks / total tasks.
- Timeline of the ten catalog tasks, each toggleable.
- Saved destinations and venues. Empty: `wedding.savedEmpty`.
- Plan fields persist as they change.

## Behavior and rules

- Storage key `wedding.plan` holds a JSON object:

```
date: string | ""          # ISO yyyy-mm-dd
destinationId: string
venueId: string
guestCount: int            # default 80
budget: int                # default 0
packageId: string
bookingStatus: none | enquirySent | confirmed
savedDestinationIds: [string]
savedVenueIds: [string]
completedTaskIds: [string]
selectedExperienceIds: [string]
searchLocation: string
searchDate: string
searchGuests: int
searchBudget: int
```

- Storage key `wedding.enquiries` holds an array of enquiry objects (`id`, `venueId`, `experienceId`, `coupleName`, `email`, `date`, `guests`, `message`, `createdAt`).
- A missing or unreadable plan is `WeddingPlan.empty`.
- Task ids: `venue`, `guests`, `attire`, `photography`, `catering`, `decor`, `invitations`, `travel`, `ceremony`, `reception`.
- Toggling a task adds or removes its id from `completedTaskIds`.
- Days remaining is calendar days from today (UTC date) to `date`, floored at 0.
- Choosing a destination or venue from this screen is not required; they are set by exploring those features or by an enquiry.

## Acceptance criteria

- AC-wedding-1: With a future date stored, Wedding shows the number of days remaining.
- AC-wedding-2: Wedding shows the selected destination and venue names when those ids are set.
- AC-wedding-3: Toggling a task persists it as completed after a reload.
- AC-wedding-4: Saved destinations on the plan appear in the saved list.
- AC-wedding-5: Changing guest count persists on the wedding plan.

## Copy

Keys under `wedding.*` in contracts/strings.

## Platform notes

- Date editing uses the native date control on each platform.
- iOS and Android reach Packages from this screen via `wedding.packagesCta`.

## Test IDs

- `wedding.countdown`: countdown.
- `wedding.destination`: selected destination.
- `wedding.venue`: selected venue.
- `wedding.guests`: guest count.
- `wedding.budget`: budget.
- `wedding.status`: booking status.
- `wedding.progress`: checklist progress.
- `wedding.task.<id>`: a timeline task.
- `wedding.saved`: saved places.
- `wedding.packagesCta`: open Packages.
- `wedding.date`: date field.

## Assumptions and open questions

- Confirmed booking status is sample-only; the app never charges. Status becomes `enquirySent` after a venue enquiry. There is no UI yet to mark `confirmed` besides storing it if present.
