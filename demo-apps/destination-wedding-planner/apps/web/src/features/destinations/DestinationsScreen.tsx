import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { weddingStyles, type WeddingStyle } from '#/features/catalog/types'
import { filterDestinations, seasonalDestinations } from '#/features/catalog/filters'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { styleLabel } from '#/features/catalog/labels'
import { strings } from '#/generated/strings'

export function DestinationsScreen() {
  const search = useSearch({ strict: false }) as {
    location?: string
    guests?: number | string
    budget?: number | string
    style?: string
  }
  const [location, setLocation] = useState(String(search.location ?? ''))
  const [style, setStyle] = useState<WeddingStyle | ''>(weddingStyles.includes(search.style as WeddingStyle) ? (search.style as WeddingStyle) : '')
  const [guests, setGuests] = useState(search.guests ? String(search.guests) : '')
  const [budget, setBudget] = useState(search.budget ? String(search.budget) : '')
  const guestCount = parsePositiveInt(guests)
  const budgetAmount = parsePositiveInt(budget)
  const results = filterDestinations({ location, style, guests: guestCount, budget: budgetAmount })
  const seasonal = seasonalDestinations()

  return (
    <Page width="full" className="px-lg py-xl md:px-xxl">
      <header className="max-w-3xl">
        <h1 className="text-display">{strings.destinationsTitle}</h1>
        <p className="mt-sm text-body text-on-surface-variant">{strings.destinationsBody}</p>
      </header>

      <section data-testid="destinations.filter.style" className="flex flex-col gap-md">
        <p className="text-label text-on-surface-variant">{strings.destinationsFilterTitle}</p>
        <div className="flex flex-wrap gap-sm">
          <FilterChip active={style === ''} onClick={() => setStyle('')}>
            {strings.styleAll}
          </FilterChip>
          {weddingStyles.map((item) => (
            <FilterChip key={item} active={style === item} onClick={() => setStyle(item)}>
              {styleLabel(item)}
            </FilterChip>
          ))}
        </div>
        <div className="grid gap-md md:grid-cols-3">
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.destinationsFilterLocation}
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={strings.homeSearchLocationPlaceholder}
              className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
            />
          </label>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.destinationsFilterGuests}
            <input
              data-testid="destinations.filter.guests"
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
              data-testid="destinations.filter.budget"
              inputMode="numeric"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder={strings.destinationsFilterBudget}
              className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-headline">{strings.destinationsSeasonalTitle}</h2>
        <div className="mt-lg grid gap-lg md:grid-cols-3">
          {seasonal.map((destination) => (
            <Link key={destination.id} to="/destinations/$id" params={{ id: destination.id }} className="overflow-hidden rounded-lg bg-surface shadow-low">
              <div className="h-48 overflow-hidden">
                <Photo src={destination.imageUrl} alt={destination.name} />
              </div>
              <div className="p-lg">
                <h3 className="text-title">{destination.name}</h3>
                <p className="mt-xs text-body text-on-surface-variant">{destination.seasonalNote}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {results.length === 0 ? (
        <div data-testid="destinations.empty" className="rounded-lg bg-surface p-xl">
          <h2 className="text-title">{strings.destinationsEmptyTitle}</h2>
          <p className="mt-sm text-body text-on-surface-variant">{strings.destinationsEmptyBody}</p>
        </div>
      ) : (
        <div data-testid="destinations.list" className="grid gap-xl md:grid-cols-2">
          {results.map((destination) => (
            <Link
              key={destination.id}
              to="/destinations/$id"
              params={{ id: destination.id }}
              data-testid={`destinations.card.${destination.id}`}
              className="group overflow-hidden rounded-xl bg-surface shadow-high"
            >
              <div className="h-64 overflow-hidden">
                <Photo src={destination.imageUrl} alt={destination.name} />
              </div>
              <div className="p-lg">
                <p className="text-caption tracking-[0.18em] text-tertiary uppercase">{destination.country}</p>
                <h2 className="mt-xs text-headline">{destination.name}</h2>
                <p className="mt-xs text-body text-primary">{destination.tagline}</p>
                <p className="mt-md text-body text-on-surface-variant">{destination.description}</p>
                <p className="mt-md text-label text-on-surface-variant">
                  {strings.destinationsCapacity({ count: destination.guestCapacityMax })} · {strings.destinationsBudgetFrom({ amount: formatAmount(destination.budgetMin) })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-touch-target rounded-full px-lg text-label motion-safe:transition motion-safe:duration-fast ${active ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'}`}
    >
      {children}
    </button>
  )
}
