import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { HeroPhoto } from '#/core/designsystem/HeroPhoto'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { categoryIcon, categoryLabel } from '#/features/catalog/labels'
import { categoryIds } from '#/features/catalog/types'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useHomeViewModel } from './useHomeViewModel'

export function HomeScreen() {
  const viewModel = useHomeViewModel()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  if (viewModel.isError) {
    return (
      <Page width="full">
        <ErrorState
          testId="city.error"
          title={strings.cityErrorTitle}
          body={strings.cityErrorBody}
          onRetry={() => void viewModel.retry()}
        />
      </Page>
    )
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    void navigate({ to: '/explore', search: { q: q || undefined, category: undefined } })
  }

  return (
    <Page width="full">
      <form onSubmit={submitSearch} className="relative">
        <AppIcons.search className="pointer-events-none absolute top-1/2 left-md size-icon-md -translate-y-1/2 text-on-surface-variant" />
        <input
          data-testid="home.search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={strings.homeSearchPlaceholder}
          aria-label={strings.commonSearch}
          className="min-h-touch-target w-full rounded-xl bg-surface py-md pr-lg pl-xxl text-body shadow-low outline-none focus-visible:outline-2 focus-visible:outline-primary"
        />
      </form>

      {viewModel.featured ? (
        <Link to="/city/$destinationId" params={{ destinationId: viewModel.featured.id }} data-testid="home.featured">
          <HeroPhoto
            imageUrl={viewModel.featured.imageUrl}
            fallbackUrl={viewModel.fallbackImageUrl}
            name={viewModel.featured.name}
            heightClassName="h-featured"
          >
            <p className="text-label text-on-overlay">{strings.homeFeaturedLabel}</p>
            <h1 className="text-display text-on-overlay">{viewModel.featured.name}</h1>
            <p className="text-label text-on-overlay">{viewModel.featured.country}</p>
          </HeroPhoto>
        </Link>
      ) : null}

      <section className="flex flex-col gap-md">
        <h2 className="text-headline">{strings.homeTrendingTitle}</h2>
        <div className="flex gap-md overflow-x-auto pb-sm">
          {viewModel.trending.map((destination) => (
            <Link
              key={destination.id}
              to="/city/$destinationId"
              params={{ destinationId: destination.id }}
              data-testid={qaId('home.trending', destination.id)}
              className="w-3xs shrink-0"
            >
              <PhotoCard
                imageUrl={destination.imageUrl}
                fallbackUrl={viewModel.fallbackImageUrl}
                name={destination.name}
                overlay={<p className="text-title text-on-overlay">{destination.name}</p>}
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-headline">{strings.homeCategoriesTitle}</h2>
        <div className="flex flex-wrap gap-sm">
          {categoryIds.map((category) => {
            const Icon = categoryIcon[category]
            return (
              <Link
                key={category}
                to="/explore"
                search={{ category, q: undefined }}
                data-testid={qaId('home.category', category)}
                className="inline-flex min-h-touch-target items-center gap-sm rounded-full bg-surface-variant px-lg text-label text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon className="size-icon-sm" />
                {categoryLabel(category)}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-headline">{strings.homePopularTitle}</h2>
        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {viewModel.popular.map((place) => (
            <Link
              key={place.id}
              to="/place/$placeId"
              params={{ placeId: place.id }}
              data-testid={qaId('home.popular', place.id)}
            >
              <PhotoCard imageUrl={place.imageUrl} fallbackUrl={viewModel.fallbackImageUrl} name={place.name}>
                <div className="flex flex-col gap-xs p-md">
                  <p className="text-title">{place.name}</p>
                  <p className="text-caption text-on-surface-variant">{viewModel.destinationName(place.destinationId)}</p>
                  <p className="text-label text-accent">{strings.homeRatingLabel({ rating: String(place.rating) })}</p>
                </div>
              </PhotoCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-headline">{strings.homeInspirationTitle}</h2>
        <div className="grid gap-lg lg:grid-cols-3">
          {viewModel.inspiration.map((destination) => (
            <Link
              key={destination.id}
              to="/city/$destinationId"
              params={{ destinationId: destination.id }}
              data-testid={qaId('home.inspiration', destination.id)}
            >
              <PhotoCard
                imageUrl={destination.imageUrl}
                fallbackUrl={viewModel.fallbackImageUrl}
                name={destination.name}
                imageClassName="h-hero"
                overlay={
                  <>
                    <p className="text-display text-on-overlay">{destination.name}</p>
                    <p className="text-label text-on-overlay">{destination.tagline}</p>
                  </>
                }
              >
                <p className="p-md text-body text-on-surface-variant">{destination.description}</p>
              </PhotoCard>
            </Link>
          ))}
        </div>
      </section>
    </Page>
  )
}
