import { Link } from '@tanstack/react-router'
import { Page } from '#/core/designsystem/Page'
import { GlassPanel } from '#/core/designsystem/GlassPanel'
import { Photo } from '#/core/designsystem/Photo'
import { primaryClass } from '#/core/designsystem/Buttons'
import { destinationById, venueById } from '#/features/catalog/WeddingCatalog'
import { daysRemaining, formatAmount, parsePositiveInt } from '#/features/catalog/format'
import { allTasks, bookingStatusLabel, taskLabel } from '#/features/catalog/labels'
import type { TaskId } from '#/features/catalog/types'
import { withToggledId } from './WeddingRepository'
import { useWeddingPlan } from './useWeddingPlan'
import { strings } from '#/generated/strings'

export function WeddingScreen() {
  const { plan, update } = useWeddingPlan()
  const destination = plan.destinationId ? destinationById(plan.destinationId) : undefined
  const venue = plan.venueId ? venueById(plan.venueId) : undefined
  const remaining = daysRemaining(plan.date)
  const savedDestinations = plan.savedDestinationIds.map(destinationById).filter((item) => item !== undefined)
  const savedVenues = plan.savedVenueIds.map(venueById).filter((item) => item !== undefined)

  return (
    <Page width="full" className="px-lg py-xl md:px-xxl">
      <header className="max-w-3xl">
        <h1 className="text-display">{strings.weddingTitle}</h1>
        <p className="mt-sm text-body text-on-surface-variant">{strings.weddingBody}</p>
      </header>

      <GlassPanel className="p-xl">
        {plan.date ? (
          <p data-testid="wedding.countdown" className="text-hero">
            {remaining === 0 ? strings.weddingCountdownToday : strings.weddingCountdown({ count: remaining })}
          </p>
        ) : (
          <div>
            <h2 className="text-headline">{strings.weddingNoDateTitle}</h2>
            <p className="mt-sm text-body text-on-surface-variant">{strings.weddingNoDateBody}</p>
          </div>
        )}
        <label className="mt-lg flex max-w-sm flex-col gap-xs text-caption text-on-surface-variant">
          {strings.weddingDate}
          <input
            data-testid="wedding.date"
            type="date"
            value={plan.date}
            onChange={(event) => void update({ date: event.target.value })}
            className={`date-field min-h-touch-target rounded-md border border-outline bg-background px-md text-body ${plan.date ? '' : 'date-field-empty'}`}
          />
        </label>
      </GlassPanel>

      <div className="grid gap-lg md:grid-cols-2">
        <GlassPanel className="p-lg">
          <p className="text-caption text-on-surface-variant">{strings.weddingDestination}</p>
          <p data-testid="wedding.destination" className="mt-sm text-title">
            {destination ? destination.name : strings.weddingNoDestination}
          </p>
          {destination ? (
            <div className="mt-md h-40 overflow-hidden rounded-lg">
              <Photo src={destination.imageUrl} alt={destination.name} />
            </div>
          ) : (
            <Link to="/destinations" className="mt-md inline-flex text-label text-primary">
              {strings.navDestinations}
            </Link>
          )}
        </GlassPanel>
        <GlassPanel className="p-lg">
          <p className="text-caption text-on-surface-variant">{strings.weddingVenue}</p>
          <p data-testid="wedding.venue" className="mt-sm text-title">
            {venue ? venue.name : strings.weddingNoVenue}
          </p>
          {venue ? (
            <div className="mt-md h-40 overflow-hidden rounded-lg">
              <Photo src={venue.imageUrl} alt={venue.name} />
            </div>
          ) : (
            <Link to="/venues" className="mt-md inline-flex text-label text-primary">
              {strings.navVenues}
            </Link>
          )}
        </GlassPanel>
      </div>

      <div className="grid gap-lg md:grid-cols-3">
        <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
          {strings.weddingGuests}
          <input
            data-testid="wedding.guests"
            inputMode="numeric"
            value={String(plan.guestCount)}
            onChange={(event) => void update({ guestCount: parsePositiveInt(event.target.value) || plan.guestCount })}
            placeholder={strings.weddingGuests}
            className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
          />
        </label>
        <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
          {strings.weddingBudget}
          <input
            data-testid="wedding.budget"
            inputMode="numeric"
            value={plan.budget ? String(plan.budget) : ''}
            onChange={(event) => void update({ budget: parsePositiveInt(event.target.value) })}
            placeholder={strings.weddingBudget}
            className="min-h-touch-target rounded-md border border-outline bg-surface px-md text-body placeholder:text-on-surface-variant"
          />
        </label>
        <div>
          <p className="text-caption text-on-surface-variant">{strings.weddingStatusLabel}</p>
          <p data-testid="wedding.status" className="mt-sm text-title">
            {bookingStatusLabel(plan.bookingStatus)}
          </p>
          {plan.budget > 0 ? <p className="mt-xs text-label text-on-surface-variant">{formatAmount(plan.budget)}</p> : null}
        </div>
      </div>

      <section>
        <h2 className="text-headline">{strings.weddingTimeline}</h2>
        <p data-testid="wedding.progress" className="mt-sm text-label text-on-surface-variant">
          {strings.weddingProgress({ completed: plan.completedTaskIds.length, total: allTasks.length })}
        </p>
        <ol className="mt-lg flex flex-col gap-sm">
          {allTasks.map((id: TaskId, index) => {
            const done = plan.completedTaskIds.includes(id)
            return (
              <li key={id}>
                <label data-testid={`wedding.task.${id}`} className="flex min-h-touch-target items-center gap-md rounded-lg bg-surface px-lg">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => void update({ completedTaskIds: withToggledId(plan.completedTaskIds, id) })}
                    className="size-4 accent-primary"
                  />
                  <span className="text-caption text-tertiary">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-body">{taskLabel(id)}</span>
                </label>
              </li>
            )
          })}
        </ol>
      </section>

      <section data-testid="wedding.saved">
        <h2 className="text-headline">{strings.weddingSaved}</h2>
        {savedDestinations.length === 0 && savedVenues.length === 0 ? (
          <p className="mt-md text-body text-on-surface-variant">{strings.weddingSavedEmpty}</p>
        ) : (
          <div className="mt-lg grid gap-lg md:grid-cols-3">
            {savedDestinations.map((item) => (
              <Link key={item.id} to="/destinations/$id" params={{ id: item.id }} className="overflow-hidden rounded-lg bg-surface shadow-low">
                <div className="h-32 overflow-hidden">
                  <Photo src={item.imageUrl} alt={item.name} />
                </div>
                <p className="p-md text-title">{item.name}</p>
              </Link>
            ))}
            {savedVenues.map((item) => (
              <Link key={item.id} to="/venues/$id" params={{ id: item.id }} className="overflow-hidden rounded-lg bg-surface shadow-low">
                <div className="h-32 overflow-hidden">
                  <Photo src={item.imageUrl} alt={item.name} />
                </div>
                <p className="p-md text-title">{item.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link to="/packages" data-testid="wedding.packagesCta" className={primaryClass}>
        {strings.weddingPackagesCta}
      </Link>
    </Page>
  )
}
