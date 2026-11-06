import type { ReactNode } from 'react'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { GoldRule } from '#/core/designsystem/GoldRule'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import type { Restaurant } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { occasionLabel, seatingLabel } from '#/features/catalog/Labels'
import type { Reservation } from '#/features/reservations/Reservation'
import { strings } from '#/generated/strings'
import { dietarySummary } from './ReserveLogic'

/** The printed-invitation card of Confirmation and Reservation detail (spec/features/reservation.md). */
export function InvitationCard({
  reservation,
  restaurant,
  codeTestId,
  restaurantTestId,
  tilt = false,
  photo = true,
}: {
  reservation: Reservation
  restaurant: Restaurant
  codeTestId?: string
  restaurantTestId?: string
  tilt?: boolean
  photo?: boolean
}) {
  return (
    <article className={`relative overflow-hidden rounded-lg bg-surface text-on-surface shadow-high ${tilt ? 'motion-safe:animate-tilt-in' : ''}`}>
      {photo && <RemoteImage src={restaurant.heroImage} alt={restaurant.name} className="aspect-3/1 w-full" />}
      <div className="relative flex flex-col gap-lg p-xl">
        <div aria-hidden="true" className="pointer-events-none absolute inset-sm rounded-md border border-accent/60" />
        <div className="flex flex-col gap-xs">
          <GoldRule />
          <AppSerif role="headline" as="h2" data-testid={restaurantTestId}>
            {restaurant.name}
          </AppSerif>
          <AppSerif role="title" italic as="p" className="text-on-surface-variant">
            {Formatters.separator(Formatters.dateLong(reservation.date), Formatters.time(reservation.time))}
          </AppSerif>
        </div>
        <hr className="border-t border-dashed border-outline" />
        <dl className="grid grid-cols-2 gap-x-lg gap-y-md">
          <Detail label={strings.reserveSummaryParty}>{strings.reserveGuestCount(reservation.partySize)}</Detail>
          <Detail label={strings.reserveSummarySeating}>{seatingLabel(reservation.seating)}</Detail>
          <Detail label={strings.reserveSummaryOccasion}>
            {reservation.occasion === 'none' ? strings.reserveSummaryNone : occasionLabel(reservation.occasion)}
          </Detail>
          <Detail label={strings.reserveSummaryDietary}>{dietarySummary(reservation.dietary)}</Detail>
          {reservation.notes.trim() !== '' && (
            <Detail label={strings.reserveSummaryNotes} wide>
              {reservation.notes}
            </Detail>
          )}
        </dl>
        <div className="flex flex-col gap-xxs">
          <p className="text-overline uppercase tracking-(--spacing-tracking) text-accent">{strings.confirmationCode}</p>
          <p data-testid={codeTestId} className="text-subtitle tracking-(--spacing-tracking)">
            {reservation.confirmationCode}
          </p>
        </div>
      </div>
    </article>
  )
}

function Detail({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-xxs ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-caption text-on-surface-variant">{label}</dt>
      <dd className="break-words text-label">{children}</dd>
    </div>
  )
}
