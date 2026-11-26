import { Link } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { IconButton } from '#/core/designsystem/IconButton'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { formatDisplayDate } from '#/features/catalog/isoDate'
import type { TripSegment } from '#/features/tripPlanner/parseTrip'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useMyTripsViewModel } from './useMyTripsViewModel'

const segments: { id: TripSegment; label: string; testId: string }[] = [
  { id: 'upcoming', label: strings.tripsUpcoming, testId: 'trips.segment.upcoming' },
  { id: 'past', label: strings.tripsPast, testId: 'trips.segment.past' },
  { id: 'drafts', label: strings.tripsDrafts, testId: 'trips.segment.drafts' },
]

export function MyTripsScreen() {
  const viewModel = useMyTripsViewModel()
  const empty = emptyCopy(viewModel.segment)

  return (
    <Page>
      <h1 data-testid="trips.title" className="text-display">
        {strings.tripsTitle}
      </h1>

      <div className="flex rounded-lg bg-surface-variant p-xs">
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            data-testid={segment.testId}
            onClick={() => viewModel.setSegment(segment.id)}
            className={`min-h-touch-target flex-1 rounded-md px-md text-label focus-visible:outline-2 focus-visible:outline-primary ${
              viewModel.segment === segment.id ? 'bg-surface text-primary shadow-low' : 'text-on-surface-variant'
            }`}
          >
            {segment.label}
          </button>
        ))}
      </div>

      {viewModel.ready && viewModel.trips.length === 0 ? (
        <EmptyState
          testId="trips.empty"
          title={empty.title}
          body={empty.body}
          action={
            viewModel.segment === 'past' ? undefined : (
              <Link
                to="/planner"
                data-testid="trips.plan"
                className="inline-flex min-h-touch-target items-center justify-center rounded-lg bg-primary px-lg text-label text-on-primary"
              >
                {strings.tripsPlan}
              </Link>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-lg">
          {viewModel.trips.map((trip) => {
            const destination = viewModel.destination(trip.destinationId)
            return (
              <div key={trip.id} className="relative">
                <Link to="/itinerary/$tripId" params={{ tripId: trip.id }} data-testid={qaId('trips.card', trip.id)}>
                  <PhotoCard
                    imageUrl={destination?.imageUrl ?? ''}
                    fallbackUrl={viewModel.fallbackImageUrl}
                    name={trip.title}
                  >
                    <div className="flex flex-col gap-xs p-md pr-xxl">
                      <p className="text-title">{trip.title}</p>
                      <p className="text-caption text-on-surface-variant">
                        {strings.itineraryDates({
                          start: formatDisplayDate(trip.startDate),
                          end: formatDisplayDate(trip.endDate),
                        })}
                      </p>
                    </div>
                  </PhotoCard>
                </Link>
                <div className="absolute top-md right-md">
                  <IconButton
                    label={strings.tripsDeleteTitle}
                    data-testid={qaId('trips.delete', trip.id)}
                    onClick={() => viewModel.requestDelete(trip.id)}
                    className="bg-overlay/40 text-on-overlay"
                  >
                    <AppIcons.trash className="size-icon-md" />
                  </IconButton>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <dialog
        ref={viewModel.dialogRef}
        className="m-auto w-full max-w-md rounded-xl bg-surface p-lg text-on-surface shadow-high"
      >
        <h2 className="text-title">{strings.tripsDeleteTitle}</h2>
        <p className="mt-md text-body">{strings.tripsDeleteBody}</p>
        <div className="mt-lg flex gap-md">
          <PrimaryButton onClick={() => void viewModel.confirmDelete()}>{strings.commonDelete}</PrimaryButton>
          <button
            type="button"
            onClick={viewModel.cancelDelete}
            className="min-h-touch-target rounded-lg px-lg text-label text-on-surface-variant"
          >
            {strings.commonCancel}
          </button>
        </div>
      </dialog>
    </Page>
  )
}

function emptyCopy(segment: TripSegment) {
  switch (segment) {
    case 'upcoming':
      return { title: strings.tripsEmptyUpcoming, body: strings.tripsEmptyUpcomingBody }
    case 'past':
      return { title: strings.tripsEmptyPast, body: strings.tripsEmptyPastBody }
    case 'drafts':
      return { title: strings.tripsEmptyDrafts, body: strings.tripsEmptyDraftsBody }
  }
}
