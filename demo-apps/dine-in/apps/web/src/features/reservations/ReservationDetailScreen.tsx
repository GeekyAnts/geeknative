import { Link, useRouteContext } from '@tanstack/react-router'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { Page } from '#/core/designsystem/Page'
import { primaryButtonClass, secondaryButtonClass } from '#/core/designsystem/Buttons'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { TopBar } from '#/core/designsystem/TopBar'
import { directionsUrl, downloadCalendarFile } from '#/features/reservation/CalendarEvent'
import { InvitationCard } from '#/features/reservation/InvitationCard'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useCancelFlow } from './CancelReservation'
import { StatusPill } from './StatusPill'
import { useReservationViewModel } from './useReservationViewModel'

export function ReservationDetailScreen({ reservationId }: { reservationId: string }) {
  const viewModel = useReservationViewModel(reservationId)
  const { container } = useRouteContext({ from: '__root__' })
  const cancel = useCancelFlow()
  const { reservation, restaurant, group } = viewModel

  return (
    <div className="min-h-dvh">
      <TopBar title={strings.reservationTitle} fallback="/reservations" />
      <Page width="form">
        <ScreenHeader title={strings.reservationTitle} />
        {viewModel.status === 'loading' && (
          <div className="flex flex-col gap-lg" aria-busy="true">
            <Skeleton className="h-list-image-height rounded-xl" />
            <Skeleton className="h-featured-card-height rounded-lg" />
          </div>
        )}
        {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
        {viewModel.status === 'notFound' && (
          <EmptyState icon={AppIcons.calendar} title={strings.reservationNotFoundTitle} body={strings.reservationNotFoundBody} testId="reservation.notFound" />
        )}
        {viewModel.status === 'ready' && reservation && restaurant && group && (
          <>
            <div className="relative overflow-hidden rounded-xl shadow-low motion-safe:animate-fade-in">
              <RemoteImage src={restaurant.heroImage} alt={restaurant.name} priority className="h-list-image-height w-full" />
              <StatusPill group={group} className="absolute start-md top-md" />
            </div>
            <div className="motion-safe:animate-fade-up">
              <InvitationCard reservation={reservation} restaurant={restaurant} photo={false} codeTestId="reservation.code" />
            </div>
            {group === 'upcoming' ? (
              <div className="grid grid-cols-2 gap-md">
                <a href={directionsUrl(restaurant)} target="_blank" rel="noreferrer" className={`${secondaryButtonClass} px-md`}>
                  <AppIcons.directions className="size-icon-sm shrink-0" />
                  {strings.confirmationDirections}
                </a>
                <button
                  type="button"
                  onClick={() => downloadCalendarFile(reservation, restaurant, container.now())}
                  className={`${secondaryButtonClass} px-md`}
                >
                  <AppIcons.addToCalendar className="size-icon-sm shrink-0" />
                  {strings.confirmationAddToCalendar}
                </button>
                <Link
                  to="/restaurants/$restaurantId/reserve"
                  params={{ restaurantId: restaurant.id }}
                  search={{ reservationId: reservation.id }}
                  className={`${primaryButtonClass} px-md`}
                >
                  <AppIcons.edit className="size-icon-sm shrink-0" />
                  {strings.reservationsModify}
                </Link>
                <button type="button" onClick={() => cancel.ask(reservation, restaurant)} className={`${secondaryButtonClass} border-error px-md text-error`}>
                  <AppIcons.cancelReservation className="size-icon-sm shrink-0" />
                  {strings.reservationsCancel}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-md">
                <Link
                  to="/restaurants/$restaurantId/reserve"
                  params={{ restaurantId: restaurant.id }}
                  state={{ rebookFrom: reservation.id }}
                  className={`${primaryButtonClass} px-md`}
                >
                  <AppIcons.rebook className="size-icon-sm shrink-0" />
                  {strings.reservationsRebook}
                </Link>
                <Link to="/restaurants/$restaurantId" params={{ restaurantId: restaurant.id }} className={`${secondaryButtonClass} px-md`}>
                  {strings.reservationsViewRestaurant}
                </Link>
              </div>
            )}
            {cancel.dialog}
          </>
        )}
      </Page>
    </div>
  )
}
