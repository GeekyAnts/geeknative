import { Link, useNavigate, useRouteContext } from '@tanstack/react-router'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { accentButtonClass, focusRing, pressable, textButtonClass } from '#/core/designsystem/Buttons'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { Page } from '#/core/designsystem/Page'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { useBack } from '#/core/useBack'
import { useCancelFlow } from '#/features/reservations/CancelReservation'
import { useReservationViewModel } from '#/features/reservations/useReservationViewModel'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { IconComponent } from '#/features/catalog/Labels'
import { directionsUrl, downloadCalendarFile } from './CalendarEvent'
import { InvitationCard } from './InvitationCard'

export function ConfirmationScreen({ reservationId }: { reservationId: string }) {
  const viewModel = useReservationViewModel(reservationId)
  const { container } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const done = useBack('/')
  const cancel = useCancelFlow(() => void navigate({ to: '/reservations', search: { segment: 'cancelled' } }))
  const { reservation, restaurant } = viewModel

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-espresso text-on-espresso">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-hero-height bg-radial from-accent/25 to-transparent to-70%" />
      <Page width="form" className="items-center pt-xxxl text-center">
        {viewModel.status === 'loading' && (
          <div className="flex w-full flex-col items-center gap-lg" aria-busy="true">
            <Skeleton className="size-avatar-large rounded-full" />
            <Skeleton className="h-xxl w-2/3 rounded-sm" />
            <Skeleton className="h-list-image-height w-full rounded-lg" />
          </div>
        )}
        {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
        {viewModel.status === 'notFound' && (
          <EmptyState
            icon={AppIcons.calendar}
            title={strings.reservationNotFoundTitle}
            body={strings.reservationNotFoundBody}
            testId="reservation.notFound"
            tone="espresso"
            action={strings.confirmationViewReservations}
            onAction={() => void navigate({ to: '/reservations', search: { segment: 'upcoming' } })}
          />
        )}
        {viewModel.status === 'ready' && reservation && restaurant && (
          <>
            <SuccessMark />
            <header className="flex flex-col items-center gap-sm motion-safe:animate-fade-up">
              <p className="text-overline uppercase tracking-(--spacing-tracking) text-accent">{strings.confirmationOverline}</p>
              <AppSerif role="hero" as="h1" className="text-on-espresso">
                {strings.confirmationTitle}
              </AppSerif>
              <p className="text-body text-on-espresso/80">{strings.confirmationBody({ restaurant: restaurant.name })}</p>
            </header>
            <div className="w-full text-start">
              <InvitationCard
                reservation={reservation}
                restaurant={restaurant}
                tilt
                codeTestId="confirmation.code"
                restaurantTestId="confirmation.restaurant"
              />
            </div>
            <div className="grid w-full grid-cols-3 gap-md">
                  <a href={directionsUrl(restaurant)} target="_blank" rel="noreferrer" data-testid="confirmation.directions" className={actionClass}>
                    <ActionContent icon={AppIcons.directions} label={strings.confirmationDirections} />
                  </a>
                  <button
                    type="button"
                    data-testid="confirmation.addToCalendar"
                    onClick={() => downloadCalendarFile(reservation, restaurant, container.now())}
                    className={actionClass}
                  >
                    <ActionContent icon={AppIcons.addToCalendar} label={strings.confirmationAddToCalendar} />
                  </button>
                  <Link
                    to="/restaurants/$restaurantId/reserve"
                    params={{ restaurantId: restaurant.id }}
                    search={{ reservationId: reservation.id }}
                    data-testid="confirmation.modify"
                    className={actionClass}
                  >
                    <ActionContent icon={AppIcons.edit} label={strings.confirmationModify} />
                  </Link>
            </div>
            <button
              type="button"
              data-testid="confirmation.cancel"
              onClick={() => cancel.ask(reservation, restaurant)}
              className={`${textButtonClass} text-on-espresso/80 hover:text-error`}
            >
              <AppIcons.cancelReservation className="size-icon-sm" />
              {strings.confirmationCancel}
            </button>
            <div className="flex w-full flex-col items-stretch gap-sm">
              <button type="button" data-testid="confirmation.done" onClick={done} className={accentButtonClass}>
                {strings.confirmationDone}
              </button>
              <Link
                to="/reservations"
                search={{ segment: 'upcoming' }}
                data-testid="confirmation.viewReservations"
                className={`${textButtonClass} text-on-espresso`}
              >
                {strings.confirmationViewReservations}
              </Link>
            </div>
            {cancel.dialog}
          </>
        )}
      </Page>
    </div>
  )
}

const actionClass = `flex min-h-touch-target flex-col items-center gap-xs rounded-lg border border-on-espresso/20 bg-on-espresso/10 px-sm py-md text-label text-on-espresso backdrop-blur-xl hover:bg-on-espresso/20 ${pressable} ${focusRing}`

function ActionContent({ icon: Icon, label }: { icon: IconComponent; label: string }) {
  return (
    <>
      <span className="flex size-touch-target items-center justify-center rounded-full bg-on-espresso/10">
        <Icon className="size-icon-md text-accent" />
      </span>
      {label}
    </>
  )
}

/** A gold circle draws itself, the check scales in, then one soft ring pulse. Reduced motion shows the final state. */
function SuccessMark() {
  return (
    <div className="relative size-avatar-large text-accent" aria-hidden="true">
      <span className="success-ring absolute inset-0 rounded-full border-2 border-accent opacity-0" />
      <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full">
        <circle className="success-circle" cx="28" cy="28" r="25" transform="rotate(-90 28 28)" />
        <path className="success-check" d="M18 29 l7 7 l13 -15" />
      </svg>
    </div>
  )
}
