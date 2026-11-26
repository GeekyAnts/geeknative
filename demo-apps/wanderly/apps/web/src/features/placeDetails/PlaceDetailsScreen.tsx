import { qaId } from '#/core/qaId'
import { HeroPhoto } from '#/core/designsystem/HeroPhoto'
import { Page } from '#/core/designsystem/Page'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { SaveButton } from '#/core/designsystem/SaveButton'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { kindLabel } from '#/features/catalog/labels'
import { strings } from '#/generated/strings'
import { usePlaceDetailsViewModel } from './usePlaceDetailsViewModel'

export function PlaceDetailsScreen() {
  const viewModel = usePlaceDetailsViewModel()

  if (viewModel.notFound) {
    return (
      <Page width="full">
        <ErrorState testId="place.error" title={strings.placeErrorTitle} body={strings.placeErrorBody} />
      </Page>
    )
  }

  const place = viewModel.place
  if (!place) return <Page width="full" />

  const photos = viewModel.gallery

  return (
    <Page width="full">
      <HeroPhoto
        testId="place.hero"
        imageUrl={place.imageUrl}
        fallbackUrl={viewModel.fallbackImageUrl}
        name={place.name}
        heightClassName="h-place-hero"
      >
        <p className="text-label text-on-overlay">{kindLabel(place.kind)}</p>
        <h1 className="text-display text-on-overlay">{place.name}</h1>
      </HeroPhoto>

      {photos.length > 1 ? (
        <div className="flex gap-md overflow-x-auto pb-sm">
          {photos.map((url) => (
            <RemoteImage
              key={url}
              src={url}
              fallbackSrc={viewModel.fallbackImageUrl}
              alt={place.name}
              className="h-card-image w-3xs shrink-0 rounded-xl"
            />
          ))}
        </div>
      ) : null}

      <dl className="grid gap-md sm:grid-cols-2">
        <p className="text-body text-accent">
          {strings.placeRating({ rating: String(place.rating), count: String(place.reviewCount) })}
        </p>
        <Fact label={strings.placeLocation} value={place.location} />
        <Fact label={strings.placeHours} value={place.openingHours} />
        {place.durationMinutes > 0 ? (
          <p className="text-body">{strings.placeDuration({ minutes: String(place.durationMinutes) })}</p>
        ) : null}
        {place.kind === 'hotel' && place.pricePerNight !== undefined && viewModel.destination ? (
          <p className="text-body">
            {strings.placePricePerNight({
              symbol: viewModel.destination.currencySymbol,
              amount: String(place.pricePerNight),
            })}
          </p>
        ) : null}
      </dl>

      <p className="text-body">{place.description}</p>

      <div className="flex flex-wrap gap-md">
        <SaveButton
          saved={viewModel.saved}
          saveLabel={strings.placeSave}
          unsaveLabel={strings.placeUnsave}
          onToggle={() => void viewModel.toggleSave()}
          testId="place.save"
        />
        <PrimaryButton data-testid="place.addToTrip" className="w-auto" onClick={viewModel.openAddToTrip}>
          {strings.placeAddToTrip}
        </PrimaryButton>
      </div>

      {viewModel.added ? (
        <p role="status" className="rounded-lg bg-surface-variant p-md text-body">
          {strings.placeAdded}
        </p>
      ) : null}

      <dialog
        ref={viewModel.dialogRef}
        className="m-auto w-full max-w-md rounded-xl bg-surface p-lg text-on-surface shadow-high"
      >
        <h2 className="text-title">{strings.placeAddToTripTitle}</h2>
        {viewModel.matchingTrips.length === 0 ? (
          <div className="mt-md flex flex-col gap-md">
            <p className="text-body">{strings.placeAddToTripEmpty}</p>
            <PrimaryButton data-testid="place.startTrip" onClick={viewModel.startTrip}>
              {strings.placeStartTrip}
            </PrimaryButton>
          </div>
        ) : (
          <ul className="mt-md flex flex-col gap-sm">
            {viewModel.matchingTrips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  data-testid={qaId('place.trip', trip.id)}
                  className="min-h-touch-target w-full rounded-lg bg-surface-variant px-md text-left text-body focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => void viewModel.addToTrip(trip.id)}
                >
                  {trip.title}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form method="dialog" className="mt-lg">
          <button type="submit" className="min-h-touch-target text-label text-on-surface-variant">
            {strings.commonClose}
          </button>
        </form>
      </dialog>
    </Page>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-md shadow-low">
      <dt className="text-caption text-on-surface-variant">{label}</dt>
      <dd className="mt-xs text-body">{value}</dd>
    </div>
  )
}
