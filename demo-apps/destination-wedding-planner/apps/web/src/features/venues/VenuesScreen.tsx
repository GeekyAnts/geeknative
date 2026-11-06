import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { destinations } from '#/features/catalog/WeddingCatalog'
import { filterVenues } from '#/features/catalog/filters'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { strings } from '#/generated/strings'

export function VenuesScreen() {
  const search = useSearch({ strict: false }) as { destination?: string; guests?: number | string; budget?: number | string }
  const [destinationId, setDestinationId] = useState(String(search.destination ?? ''))
  const [guests, setGuests] = useState(search.guests ? String(search.guests) : '')
  const [budget, setBudget] = useState(search.budget ? String(search.budget) : '')
  const results = filterVenues({
    destinationId,
    guests: parsePositiveInt(guests),
    budget: parsePositiveInt(budget),
  })

  return (
    <Page width="full" className="px-lg py-xl md:px-xxl">
      <header className="max-w-3xl">
        <h1 className="text-display">{strings.venuesTitle}</h1>
        <p className="mt-sm text-body text-on-surface-variant">{strings.venuesBody}</p>
      </header>
      <div className="grid gap-md md:grid-cols-3">
        <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
          {strings.venuesFilterDestination}
          <select
            data-testid="venues.filter.destination"
            value={destinationId}
            onChange={(event) => setDestinationId(event.target.value)}
            className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body"
          >
            <option value="">{strings.venuesFilterAllDestinations}</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
          {strings.destinationsFilterGuests}
          <input
            inputMode="numeric"
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            placeholder={strings.destinationsFilterGuests}
            className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
          />
        </label>
        <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
          {strings.destinationsFilterBudget}
          <input
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder={strings.destinationsFilterBudget}
            className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
          />
        </label>
      </div>
      {results.length === 0 ? (
        <div className="rounded-lg bg-surface p-xl">
          <h2 className="text-title">{strings.venuesEmptyTitle}</h2>
          <p className="mt-sm text-body text-on-surface-variant">{strings.venuesEmptyBody}</p>
        </div>
      ) : (
        <div data-testid="venues.list" className="grid gap-xl md:grid-cols-2">
          {results.map((venue) => (
            <Link key={venue.id} to="/venues/$id" params={{ id: venue.id }} data-testid={`venues.card.${venue.id}`} className="overflow-hidden rounded-xl bg-surface shadow-high">
              <div className="h-64 overflow-hidden">
                <Photo src={venue.imageUrl} alt={venue.name} />
              </div>
              <div className="p-lg">
                <h2 className="text-headline">{venue.name}</h2>
                <p className="mt-xs text-body text-on-surface-variant">{venue.location}</p>
                <p className="mt-md text-label">
                  {strings.venuesCapacity({ count: venue.capacity })} · {strings.venuesPriceFrom({ amount: formatAmount(venue.priceFrom) })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  )
}
