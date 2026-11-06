import { Link } from '@tanstack/react-router'
import { GlassPanel } from '#/core/designsystem/GlassPanel'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { packages, venueById } from '#/features/catalog/WeddingCatalog'
import { formatAmount } from '#/features/catalog/format'
import { styleLabel } from '#/features/catalog/labels'
import type { Destination } from '#/features/catalog/types'
import { withToggledId } from '#/features/wedding/WeddingRepository'
import { useWeddingPlan } from '#/features/wedding/useWeddingPlan'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

export function DestinationDetailScreen({ destination }: { destination: Destination }) {
  const { plan, update } = useWeddingPlan()
  const saved = plan.savedDestinationIds.includes(destination.id)
  const destinationVenues = destination.venueIds.map(venueById).filter((item) => item !== undefined)
  const destinationPackages = packages.filter((item) => destination.packageIds.includes(item.id))

  return (
    <Page width="full">
      <div className="relative h-[70vh] min-h-[28rem] overflow-hidden">
        <Photo src={destination.imageUrl} alt={destination.name} cinematic />
        <div className="absolute inset-0 bg-linear-to-t from-on-inverse/80 via-on-inverse/20 to-on-inverse/15" />
        <div className="absolute inset-x-lg bottom-xl md:inset-x-xxl">
          <p className="text-caption tracking-[0.22em] text-tertiary uppercase">{destination.region}</p>
          <h1 className="text-hero text-inverse">{destination.name}</h1>
          <p className="mt-sm max-w-2xl text-title text-inverse/90">{destination.tagline}</p>
        </div>
      </div>
      <div className="grid gap-xl px-lg py-xxl md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] md:px-xxl">
        <div className="flex flex-col gap-lg">
          <p className="text-body">{destination.description}</p>
          <p className="text-body text-on-surface-variant">{destination.seasonalNote}</p>
          <p className="text-label text-on-surface-variant">
            {destination.styles.map(styleLabel).join(' · ')} · {strings.destinationsCapacity({ count: destination.guestCapacityMax })} ·{' '}
            {strings.destinationsBudgetFrom({ amount: formatAmount(destination.budgetMin) })}
          </p>
          <div className="grid gap-md md:grid-cols-3">
            {destination.gallery.map((src) => (
              <div key={src} className="h-48 overflow-hidden rounded-lg">
                <Photo src={src} alt={destination.name} />
              </div>
            ))}
          </div>
          <section data-testid="destinations.venues">
            <h2 className="text-headline">{strings.destinationsVenuesTitle}</h2>
            <div className="mt-lg grid gap-lg md:grid-cols-2">
              {destinationVenues.map((venue) => (
                <Link key={venue.id} to="/venues/$id" params={{ id: venue.id }} className="overflow-hidden rounded-lg bg-surface shadow-low">
                  <div className="h-40 overflow-hidden">
                    <Photo src={venue.imageUrl} alt={venue.name} />
                  </div>
                  <div className="p-lg">
                    <h3 className="text-title">{venue.name}</h3>
                    <p className="mt-xs text-label text-on-surface-variant">{strings.venuesPriceFrom({ amount: formatAmount(venue.priceFrom) })}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-headline">{strings.destinationsPackagesTitle}</h2>
            <ul className="mt-md flex flex-col gap-sm">
              {destinationPackages.map((item) => (
                <li key={item.id} className="text-body">
                  {item.name}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <GlassPanel className="h-fit p-lg">
          <button
            type="button"
            data-testid="destinations.save"
            aria-label={saved ? strings.destinationsUnsave : strings.destinationsSave}
            onClick={() => void update({ savedDestinationIds: withToggledId(plan.savedDestinationIds, destination.id), destinationId: destination.id })}
            className="inline-flex min-h-touch-target w-full items-center justify-center gap-sm rounded-full bg-primary text-label text-on-primary"
          >
            <AppIcons.heart className="size-icon-sm" />
            {saved ? strings.commonSaved : strings.destinationsSave}
          </button>
          <Link to="/venues" search={{ destination: destination.id }} className="mt-md inline-flex min-h-touch-target w-full items-center justify-center rounded-full border border-primary text-label text-primary">
            {strings.navVenues}
          </Link>
        </GlassPanel>
      </div>
    </Page>
  )
}
