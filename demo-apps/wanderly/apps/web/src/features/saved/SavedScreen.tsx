import { Link } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { SaveButton } from '#/core/designsystem/SaveButton'
import { kindLabel } from '#/features/catalog/labels'
import { strings } from '#/generated/strings'
import { useSavedViewModel } from './useSavedViewModel'

export function SavedScreen() {
  const viewModel = useSavedViewModel()

  return (
    <Page width="full">
      <h1 data-testid="saved.title" className="text-display">
        {strings.savedTitle}
      </h1>

      {viewModel.isEmpty ? (
        <EmptyState testId="saved.empty" title={strings.savedEmptyTitle} body={strings.savedEmptyBody} />
      ) : (
        <>
          {viewModel.destinations.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="text-headline">{strings.savedDestinations}</h2>
              <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                {viewModel.destinations.map((destination) => (
                  <div key={destination.id} className="relative">
                    <Link
                      to="/city/$destinationId"
                      params={{ destinationId: destination.id }}
                      data-testid={qaId('saved.destination', destination.id)}
                    >
                      <PhotoCard
                        imageUrl={destination.imageUrl}
                        fallbackUrl={viewModel.fallbackImageUrl}
                        name={destination.name}
                        overlay={<p className="text-title text-on-overlay">{destination.name}</p>}
                      />
                    </Link>
                    <div className="absolute top-md right-md">
                      <SaveButton
                        saved
                        saveLabel={strings.citySave}
                        unsaveLabel={strings.cityUnsave}
                        onToggle={() => void viewModel.unsave({ id: destination.id, kind: 'destination' })}
                        testId={qaId('saved.unsave', destination.id)}
                        onPhoto
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {viewModel.places.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="text-headline">{strings.savedPlaces}</h2>
              <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                {viewModel.places.map((place) => (
                  <div key={place.id} className="relative">
                    <Link to="/place/$placeId" params={{ placeId: place.id }} data-testid={qaId('saved.place', place.id)}>
                      <PhotoCard imageUrl={place.imageUrl} fallbackUrl={viewModel.fallbackImageUrl} name={place.name}>
                        <div className="flex flex-col gap-xs p-md">
                          <p className="text-title">{place.name}</p>
                          <p className="text-caption text-on-surface-variant">{kindLabel(place.kind)}</p>
                        </div>
                      </PhotoCard>
                    </Link>
                    <div className="absolute top-md right-md">
                      <SaveButton
                        saved
                        saveLabel={strings.placeSave}
                        unsaveLabel={strings.placeUnsave}
                        onToggle={() => void viewModel.unsave({ id: place.id, kind: place.kind })}
                        testId={qaId('saved.unsave', place.id)}
                        onPhoto
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </Page>
  )
}
