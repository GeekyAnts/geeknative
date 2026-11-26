import { Link } from '@tanstack/react-router'
import { qaId } from '#/core/qaId'
import { AppCard } from '#/core/designsystem/AppCard'
import { HeroPhoto } from '#/core/designsystem/HeroPhoto'
import { IconButton } from '#/core/designsystem/IconButton'
import { Page } from '#/core/designsystem/Page'
import { PhotoCard } from '#/core/designsystem/PhotoCard'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { formatDisplayDate } from '#/features/catalog/isoDate'
import type { TripDay, TripItem } from '#/features/catalog/types'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useItineraryViewModel } from './useItineraryViewModel'

export function ItineraryScreen() {
  const viewModel = useItineraryViewModel()
  const trip = viewModel.trip
  const destination = viewModel.destination

  if (!viewModel.ready) {
    return (
      <Page width="full">
        <div className="h-hero rounded-xl bg-surface-variant" aria-busy="true" />
      </Page>
    )
  }

  if (!trip || !destination || !viewModel.budget) {
    return <Page width="full" />
  }

  const budget = viewModel.budget
  const amount = (value: number) =>
    strings.itineraryBudgetAmount({ symbol: destination.currencySymbol, amount: String(value) })

  return (
    <Page width="full">
      <HeroPhoto
        testId="itinerary.hero"
        imageUrl={destination.imageUrl}
        fallbackUrl={viewModel.fallbackImageUrl}
        name={trip.title}
        heightClassName="h-hero"
      >
        <h1 className="text-display text-on-overlay">{trip.title}</h1>
        <p className="text-label text-on-overlay">
          {strings.itineraryDates({ start: formatDisplayDate(trip.startDate), end: formatDisplayDate(trip.endDate) })}
        </p>
        <p className="text-label text-on-overlay">{strings.itineraryTravelers(trip.travelers)}</p>
      </HeroPhoto>

      <AppCard data-testid="itinerary.budget">
        <h2 className="text-title">{strings.itineraryBudgetTitle}</h2>
        <dl className="mt-md flex flex-col gap-sm">
          <BudgetRow label={strings.itineraryBudgetLodging} value={amount(budget.lodging)} />
          <BudgetRow label={strings.itineraryBudgetFood} value={amount(budget.food)} />
          <BudgetRow label={strings.itineraryBudgetActivities} value={amount(budget.activities)} />
          <BudgetRow label={strings.itineraryBudgetTotal} value={amount(budget.total)} />
        </dl>
      </AppCard>

      {trip.days.map((day) => (
        <DaySection key={day.dayIndex} day={day} viewModel={viewModel} />
      ))}

      <PrimaryButton data-testid="itinerary.saveTrip" onClick={() => void viewModel.saveTrip()}>
        {strings.itinerarySaveTrip}
      </PrimaryButton>

      <dialog
        ref={viewModel.addDialogRef}
        className="m-auto w-full max-w-md rounded-xl bg-surface p-lg text-on-surface shadow-high"
      >
        <h2 className="text-title">{strings.itineraryAddPlaceTitle}</h2>
        <ul className="mt-md flex max-h-hero flex-col gap-sm overflow-y-auto">
          {viewModel.addDayPlaces.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="flex min-h-touch-target w-full items-center gap-md rounded-lg bg-surface-variant p-sm text-left focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => void viewModel.addPlace(place)}
              >
                <RemoteImage
                  src={place.imageUrl}
                  fallbackSrc={viewModel.fallbackImageUrl}
                  alt={place.name}
                  className="size-thumb shrink-0 rounded-md"
                />
                <span className="text-body">{place.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <form method="dialog" className="mt-lg">
          <button type="submit" className="min-h-touch-target text-label text-on-surface-variant">
            {strings.commonClose}
          </button>
        </form>
      </dialog>
    </Page>
  )
}

function BudgetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <dt className="text-body text-on-surface-variant">{label}</dt>
      <dd className="text-body">{value}</dd>
    </div>
  )
}

function DaySection({
  day,
  viewModel,
}: {
  day: TripDay
  viewModel: ReturnType<typeof useItineraryViewModel>
}) {
  return (
    <section data-testid={qaId('itinerary.day', day.dayIndex)} className="flex flex-col gap-md">
      <div>
        <h2 className="text-headline">{strings.itineraryDayTitle({ day: String(day.dayIndex) })}</h2>
        <p className="text-caption text-on-surface-variant">{formatDisplayDate(day.date)}</p>
      </div>
      {day.items.length === 0 ? (
        <p className="text-body text-on-surface-variant">{strings.itineraryEmptyDay}</p>
      ) : (
        day.items.map((item, index) => (
          <TripItemCard
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === day.items.length - 1}
            viewModel={viewModel}
          />
        ))
      )}
      <button
        type="button"
        data-testid={qaId('itinerary.add', day.dayIndex)}
        onClick={() => viewModel.openAdd(day.dayIndex)}
        className="inline-flex min-h-touch-target items-center justify-center gap-sm rounded-lg bg-surface px-lg text-label text-primary shadow-low focus-visible:outline-2 focus-visible:outline-primary"
      >
        <AppIcons.plus className="size-icon-sm" />
        {strings.itineraryAdd}
      </button>
    </section>
  )
}

function TripItemCard({
  item,
  isFirst,
  isLast,
  viewModel,
}: {
  item: TripItem
  isFirst: boolean
  isLast: boolean
  viewModel: ReturnType<typeof useItineraryViewModel>
}) {
  const place = viewModel.place(item.placeId)
  if (!place) return null
  const duration =
    item.durationMinutes > 0
      ? strings.itineraryTimeDuration({ time: item.startTime, minutes: String(item.durationMinutes) })
      : item.startTime

  return (
    <div
      data-testid={qaId('itinerary.item', item.id)}
      className={`overflow-hidden rounded-xl bg-surface shadow-low ${item.completed ? 'text-on-surface-variant' : ''}`}
    >
      <Link to="/place/$placeId" params={{ placeId: place.id }} className="block">
        <PhotoCard imageUrl={place.imageUrl} fallbackUrl={viewModel.fallbackImageUrl} name={place.name}>
          <div className="flex flex-col gap-xs p-md">
            <p className="text-title">{place.name}</p>
            <p className="text-caption">{duration}</p>
            <p className="text-body">{place.summary}</p>
          </div>
        </PhotoCard>
      </Link>
      <div className="flex flex-wrap items-center gap-xs p-sm">
        <IconButton
          label={item.completed ? strings.itineraryIncomplete : strings.itineraryComplete}
          data-testid={qaId('itinerary.complete', item.id)}
          onClick={() => void viewModel.complete(item.id)}
          className={item.completed ? 'text-primary' : 'text-on-surface-variant'}
        >
          <AppIcons.checkCircle className={`size-icon-md ${item.completed ? 'fill-primary text-on-primary' : ''}`} />
        </IconButton>
        <IconButton
          label={strings.itineraryMoveUp}
          data-testid={qaId('itinerary.moveUp', item.id)}
          disabled={isFirst}
          onClick={() => void viewModel.move(item.id, 'up')}
          className="text-on-surface-variant disabled:opacity-50"
        >
          <AppIcons.chevronUp className="size-icon-md" />
        </IconButton>
        <IconButton
          label={strings.itineraryMoveDown}
          data-testid={qaId('itinerary.moveDown', item.id)}
          disabled={isLast}
          onClick={() => void viewModel.move(item.id, 'down')}
          className="text-on-surface-variant disabled:opacity-50"
        >
          <AppIcons.chevronDown className="size-icon-md" />
        </IconButton>
        <IconButton
          label={strings.itineraryRemove}
          data-testid={qaId('itinerary.remove', item.id)}
          onClick={() => void viewModel.remove(item.id)}
          className="text-error"
        >
          <AppIcons.trash className="size-icon-md" />
        </IconButton>
      </div>
    </div>
  )
}
