import { Link } from '@tanstack/react-router'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { GoldRule } from '#/core/designsystem/GoldRule'
import { focusRing, smallPrimaryButtonClass, smallSecondaryButtonClass } from '#/core/designsystem/Buttons'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { Page } from '#/core/designsystem/Page'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { SegmentedControl } from '#/core/designsystem/SegmentedControl'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { staggerDelay } from '#/core/motion'
import type { Restaurant } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { seatingLabel } from '#/features/catalog/Labels'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useCancelFlow } from './CancelReservation'
import type { Reservation, ReservationGroup } from './Reservation'
import { StatusPill } from './StatusPill'
import { reservationActions, reservationGroups, useReservationsViewModel } from './useReservationsViewModel'

const segmentLabel: Record<ReservationGroup, string> = {
  upcoming: strings.reservationsTabUpcoming,
  past: strings.reservationsTabPast,
  cancelled: strings.reservationsTabCancelled,
}

const empty = {
  upcoming: { icon: AppIcons.calendar, title: strings.reservationsEmptyUpcomingTitle, body: strings.reservationsEmptyUpcomingBody },
  past: { icon: AppIcons.clock, title: strings.reservationsEmptyPastTitle, body: strings.reservationsEmptyPastBody },
  cancelled: { icon: AppIcons.cancelReservation, title: strings.reservationsEmptyCancelledTitle, body: strings.reservationsEmptyCancelledBody },
} satisfies Record<ReservationGroup, unknown>

export function ReservationsScreen({ segment }: { segment: ReservationGroup }) {
  const viewModel = useReservationsViewModel(segment)
  const cancel = useCancelFlow()

  return (
    <Page width="wide" tabs className="pt-xl">
      <ScreenHeader overline={strings.reservationsSubtitle} title={strings.reservationsTitle} />
      <div className="w-full max-w-xl">
        <SegmentedControl
          label={strings.reservationsTitle}
          selected={segment}
          onSelect={viewModel.select}
          options={reservationGroups.map((group) => ({
            id: group,
            label: segmentLabel[group],
            count: viewModel.status === 'ready' ? viewModel.groups[group].length : undefined,
            testId: `reservations.segment.${group}`,
          }))}
        />
      </div>
      {viewModel.status === 'loading' && (
        <div className="grid gap-lg md:grid-cols-2" aria-busy="true">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-featured-card-height rounded-lg" />
          ))}
        </div>
      )}
      {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
      {viewModel.status === 'ready' && viewModel.items.length === 0 && (
        <EmptyState key={segment} {...empty[segment]} testId="reservations.empty">
          {segment === 'upcoming' && (
            <Link to="/" className={`${smallPrimaryButtonClass} mt-sm`}>
              {strings.reservationsEmptyCta}
            </Link>
          )}
        </EmptyState>
      )}
      {viewModel.status === 'ready' && viewModel.items.length > 0 && (
        <ul key={segment} role="tabpanel" className="grid gap-lg md:grid-cols-2 desk:grid-cols-3">
          {viewModel.items.map((reservation, index) => (
            <li key={reservation.id} className="motion-safe:animate-fade-up" style={{ animationDelay: staggerDelay(index) }}>
              <ReservationCard
                reservation={reservation}
                restaurant={viewModel.restaurant(reservation)}
                group={segment}
                onCancel={() => cancel.ask(reservation, viewModel.restaurant(reservation))}
              />
            </li>
          ))}
        </ul>
      )}
      {cancel.dialog}
    </Page>
  )
}

function ReservationCard({
  reservation,
  restaurant,
  group,
  onCancel,
}: {
  reservation: Reservation
  restaurant?: Restaurant
  group: ReservationGroup
  onCancel: () => void
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface text-on-surface shadow-low motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy has-[a:active]:scale-97">
      <Link
        to="/reservations/$reservationId"
        params={{ reservationId: reservation.id }}
        data-testid={`reservations.card.${reservation.id}`}
        className={`group flex flex-1 flex-col ${focusRing}`}
      >
        <div className="relative">
          {restaurant && <RemoteImage src={restaurant.heroImage} alt={restaurant.name} className="aspect-3/1 w-full" />}
          <StatusPill group={group} className="absolute start-md top-md" />
        </div>
        <div className="flex flex-col gap-xxs p-lg pb-md">
          <GoldRule />
          <AppSerif role="title" as="h2">
            {restaurant?.name}
          </AppSerif>
          <p className="text-subtitle">{Formatters.separator(Formatters.dateShort(reservation.date), Formatters.time(reservation.time))}</p>
          <p className="text-caption text-on-surface-variant">
            {Formatters.separator(strings.reserveGuestCount(reservation.partySize), seatingLabel(reservation.seating))}
          </p>
          <p className="text-caption tracking-(--spacing-tracking) text-on-surface-variant">{reservation.confirmationCode}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-sm px-lg pb-lg">
        {reservationActions(group).map((action) =>
          action === 'modify' ? (
            <Link
              key={action}
              to="/restaurants/$restaurantId/reserve"
              params={{ restaurantId: reservation.restaurantId }}
              search={{ reservationId: reservation.id }}
              data-testid={`reservations.modify.${reservation.id}`}
              className={smallSecondaryButtonClass}
            >
              <AppIcons.edit className="size-icon-sm" />
              {strings.reservationsModify}
            </Link>
          ) : action === 'cancel' ? (
            <button key={action} type="button" data-testid={`reservations.cancel.${reservation.id}`} onClick={onCancel} className={smallSecondaryButtonClass}>
              <AppIcons.cancelReservation className="size-icon-sm" />
              {strings.reservationsCancel}
            </button>
          ) : (
            <Link
              key={action}
              to="/restaurants/$restaurantId/reserve"
              params={{ restaurantId: reservation.restaurantId }}
              state={{ rebookFrom: reservation.id }}
              data-testid={`reservations.rebook.${reservation.id}`}
              className={smallPrimaryButtonClass}
            >
              <AppIcons.rebook className="size-icon-sm" />
              {strings.reservationsRebook}
            </Link>
          ),
        )}
      </div>
    </article>
  )
}
