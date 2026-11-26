import { Link } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { HeroPhoto } from '#/core/designsystem/HeroPhoto'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { SaveButton } from '#/core/designsystem/SaveButton'
import { AppCard } from '#/core/designsystem/AppCard'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { Place } from '#/features/catalog/types'
import { useCityDetailsViewModel } from './useCityDetailsViewModel'

export function CityDetailsScreen() {
  const viewModel = useCityDetailsViewModel()

  if (viewModel.notFound) {
    return (
      <Page width="full">
        <ErrorState testId="city.error" title={strings.cityErrorTitle} body={strings.cityErrorBody} />
      </Page>
    )
  }

  const destination = viewModel.destination
  if (!destination) return <Page width="full" />

  return (
    <Page width="full">
      <HeroPhoto
        testId="city.hero"
        imageUrl={destination.imageUrl}
        fallbackUrl={viewModel.fallbackImageUrl}
        name={destination.name}
        heightClassName="h-hero"
        corner={
          <SaveButton
            saved={viewModel.saved}
            saveLabel={strings.citySave}
            unsaveLabel={strings.cityUnsave}
            onToggle={() => void viewModel.toggleSave()}
            testId="city.save"
            onPhoto
          />
        }
      >
        <h1 className="text-display text-on-overlay">{destination.name}</h1>
        <p className="text-label text-on-overlay">{destination.country}</p>
      </HeroPhoto>

      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={strings.cityBestTime} value={destination.bestTimeToVisit} />
        <Fact
          label={strings.cityWeather}
          value={strings.cityWeatherValue({
            temp: String(destination.weather.tempC),
            summary: destination.weather.summary,
          })}
        />
        <Fact label={strings.cityCurrency} value={`${destination.currencySymbol} ${destination.currency}`} />
        <Fact label={strings.cityLanguage} value={destination.language} />
      </div>

      <p className="text-body">{destination.description}</p>

      <PlaceRow
        testId="city.attractions"
        title={strings.cityAttractions}
        places={viewModel.attractions}
        fallbackUrl={viewModel.fallbackImageUrl}
      />
      <PlaceRow
        testId="city.hotels"
        title={strings.cityHotels}
        places={viewModel.hotels}
        fallbackUrl={viewModel.fallbackImageUrl}
      />
      <PlaceRow
        testId="city.restaurants"
        title={strings.cityRestaurants}
        places={viewModel.restaurants}
        fallbackUrl={viewModel.fallbackImageUrl}
      />
      <PlaceRow
        testId="city.activities"
        title={strings.cityActivities}
        places={viewModel.activities}
        fallbackUrl={viewModel.fallbackImageUrl}
      />

      <section className="flex flex-col gap-md">
        <h2 className="text-headline">{strings.cityTips}</h2>
        {destination.travelTips.map((tip) => (
          <AppCard key={tip} className="flex flex-row items-start gap-md">
            <AppIcons.info className="mt-xs size-icon-md shrink-0 text-primary" />
            <p className="text-body">{tip}</p>
          </AppCard>
        ))}
      </section>

      <Link
        to="/planner"
        search={{ destinationId: destination.id }}
        data-testid="city.planTrip"
        className="inline-flex min-h-touch-target w-full items-center justify-center rounded-lg bg-primary px-lg text-label text-on-primary shadow-high focus-visible:outline-2 focus-visible:outline-primary"
      >
        {strings.cityPlanTrip}
      </Link>
    </Page>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-md shadow-low">
      <p className="text-caption text-on-surface-variant">{label}</p>
      <p className="mt-xs text-body">{value}</p>
    </div>
  )
}

function PlaceRow({
  testId,
  title,
  places,
  fallbackUrl,
}: {
  testId: string
  title: string
  places: Place[]
  fallbackUrl: string
}) {
  return (
    <section data-testid={testId} className="flex flex-col gap-md">
      <h2 className="text-headline">{title}</h2>
      <div className="flex gap-md overflow-x-auto pb-sm">
        {places.map((place) => (
          <Link
            key={place.id}
            to="/place/$placeId"
            params={{ placeId: place.id }}
            data-testid={qaId('city.place', place.id)}
            className="w-3xs shrink-0"
          >
            <PhotoCard imageUrl={place.imageUrl} fallbackUrl={fallbackUrl} name={place.name}>
              <div className="flex flex-col gap-xs p-md">
                <p className="text-title">{place.name}</p>
                <p className="text-label text-accent">{strings.homeRatingLabel({ rating: String(place.rating) })}</p>
              </div>
            </PhotoCard>
          </Link>
        ))}
      </div>
    </section>
  )
}
