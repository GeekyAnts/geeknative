import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { Chip } from '#/core/designsystem/Chip'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { categoryIcon, categoryLabel, kindLabel } from '#/features/catalog/labels'
import { categoryIds } from '#/features/catalog/types'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useExploreViewModel } from './useExploreViewModel'

export function ExploreScreen() {
  const viewModel = useExploreViewModel()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    viewModel.submitQuery()
  }

  return (
    <Page width="full">
      <h1 data-testid="explore.title" className="text-display">
        {strings.exploreTitle}
      </h1>

      <form onSubmit={submit} className="relative">
        <AppIcons.search className="pointer-events-none absolute top-1/2 left-md size-icon-md -translate-y-1/2 text-on-surface-variant" />
        <input
          data-testid="explore.search"
          type="search"
          value={viewModel.query}
          onChange={(event) => viewModel.setQuery(event.target.value)}
          placeholder={strings.exploreSearchPlaceholder}
          aria-label={strings.commonSearch}
          className="min-h-touch-target w-full rounded-xl bg-surface py-md pr-lg pl-xxl text-body shadow-low outline-none focus-visible:outline-2 focus-visible:outline-primary"
        />
      </form>

      <section className="flex flex-col gap-md">
        <h2 className="text-title">{strings.exploreFiltersTitle}</h2>
        <div className="flex flex-wrap gap-sm">
          {categoryIds.map((category) => {
            const Icon = categoryIcon[category]
            return (
              <Chip
                key={category}
                selected={viewModel.category === category}
                data-testid={qaId('explore.category', category)}
                onClick={() => viewModel.selectCategory(category)}
              >
                <Icon className="size-icon-sm" />
                {categoryLabel(category)}
              </Chip>
            )
          })}
        </div>
      </section>

      {viewModel.isEmpty ? (
        <EmptyState
          testId="explore.empty"
          title={strings.exploreEmptyTitle}
          body={strings.exploreEmptyBody}
          action={
            <PrimaryButton data-testid="explore.clearFilters" onClick={viewModel.clearFilters}>
              {strings.exploreClearFilters}
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <section className="flex flex-col gap-md">
            <h2 className="text-headline">{strings.exploreDestinationsTitle}</h2>
            <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
              {viewModel.destinations.map((destination) => (
                <Link
                  key={destination.id}
                  to="/city/$destinationId"
                  params={{ destinationId: destination.id }}
                  data-testid={qaId('explore.destination', destination.id)}
                >
                  <PhotoCard
                    imageUrl={destination.imageUrl}
                    fallbackUrl={viewModel.fallbackImageUrl}
                    name={destination.name}
                    overlay={
                      <>
                        <p className="text-title text-on-overlay">{destination.name}</p>
                        <p className="text-caption text-on-overlay">{destination.country}</p>
                      </>
                    }
                  />
                </Link>
              ))}
            </div>
          </section>

          {viewModel.places.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="text-headline">{strings.explorePlacesTitle}</h2>
              <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                {viewModel.places.map((place) => (
                  <Link
                    key={place.id}
                    to="/place/$placeId"
                    params={{ placeId: place.id }}
                    data-testid={qaId('explore.place', place.id)}
                  >
                    <PhotoCard imageUrl={place.imageUrl} fallbackUrl={viewModel.fallbackImageUrl} name={place.name}>
                      <div className="flex flex-col gap-xs p-md">
                        <p className="text-title">{place.name}</p>
                        <p className="text-caption text-on-surface-variant">{kindLabel(place.kind)}</p>
                        <p className="text-caption text-on-surface-variant">{viewModel.destinationName(place.destinationId)}</p>
                      </div>
                    </PhotoCard>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </Page>
  )
}
