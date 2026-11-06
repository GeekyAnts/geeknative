import { useState } from 'react'
import { EnquireDialog, type EnquiryDraft } from '#/core/designsystem/EnquireDialog'
import { GlassPanel } from '#/core/designsystem/GlassPanel'
import { Page } from '#/core/designsystem/Page'
import { Photo } from '#/core/designsystem/Photo'
import { primaryClass, secondaryClass } from '#/core/designsystem/Buttons'
import { destinationById, packages } from '#/features/catalog/WeddingCatalog'
import { formatAmount, parsePositiveInt } from '#/features/catalog/format'
import type { Venue } from '#/features/catalog/types'
import { withToggledId } from '#/features/wedding/WeddingRepository'
import { useWeddingPlan } from '#/features/wedding/useWeddingPlan'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

export function VenueDetailScreen({ venue }: { venue: Venue }) {
  const { plan, update, addEnquiry } = useWeddingPlan()
  const destination = destinationById(venue.destinationId)
  const saved = plan.savedVenueIds.includes(venue.id)
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  async function send(draft: EnquiryDraft) {
    await addEnquiry({
      id: `${Date.now()}`,
      venueId: venue.id,
      experienceId: '',
      coupleName: draft.coupleName,
      email: draft.email,
      date: draft.date,
      guests: parsePositiveInt(draft.guests),
      message: draft.message,
      createdAt: new Date().toISOString(),
    })
    await update({
      venueId: venue.id,
      destinationId: venue.destinationId,
      bookingStatus: 'enquirySent',
      date: draft.date || plan.date,
      guestCount: parsePositiveInt(draft.guests) || plan.guestCount,
    })
    setSuccess(true)
  }

  return (
    <Page width="full">
      <div className="relative h-[70vh] min-h-[28rem] overflow-hidden">
        <Photo src={venue.imageUrl} alt={venue.name} cinematic />
        <div className="absolute inset-0 bg-linear-to-t from-on-inverse/80 via-on-inverse/20 to-on-inverse/15" />
        <div className="absolute inset-x-lg bottom-xl md:inset-x-xxl">
          <p className="text-caption tracking-[0.22em] text-tertiary uppercase">{destination?.name}</p>
          <h1 className="text-hero text-inverse">{venue.name}</h1>
        </div>
      </div>
      <div className="grid gap-xl px-lg py-xxl md:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] md:px-xxl">
        <div className="flex flex-col gap-xl">
          <p className="text-body">{venue.description}</p>
          <div className="grid gap-md md:grid-cols-3">
            {venue.gallery.map((src) => (
              <div key={src} className="h-48 overflow-hidden rounded-lg">
                <Photo src={src} alt={venue.name} />
              </div>
            ))}
          </div>
          <section>
            <h2 className="text-headline">{strings.venuesHighlights}</h2>
            <ul className="mt-md flex flex-col gap-sm text-body">
              {venue.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesSpaces}</h2>
            <p className="mt-md text-body text-on-surface-variant">{venue.spaces.join(' · ')}</p>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesAccommodation}</h2>
            <p className="mt-md text-body text-on-surface-variant">{venue.accommodation}</p>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesAmenities}</h2>
            <p className="mt-md text-body text-on-surface-variant">{venue.amenities.join(' · ')}</p>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesPackages}</h2>
            <p className="mt-md text-body text-on-surface-variant">{packages.filter((item) => venue.packageIds.includes(item.id)).map((item) => item.name).join(' · ')}</p>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesReviews}</h2>
            <ul className="mt-md flex flex-col gap-md">
              {venue.reviews.map((review) => (
                <li key={review.author} className="rounded-lg bg-surface p-lg shadow-low">
                  <p className="text-title">{review.author}</p>
                  <p className="mt-sm text-body text-on-surface-variant">{review.body}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-headline">{strings.venuesLocation}</h2>
            <p className="mt-md text-body">{venue.location}</p>
            <a
              data-testid="venues.map"
              href={`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`}
              className={`${secondaryClass} mt-md`}
            >
              <AppIcons.map className="size-icon-sm" />
              {strings.venuesOpenMap}
            </a>
          </section>
        </div>
        <GlassPanel className="h-fit p-lg">
          <p className="text-label text-on-surface-variant">{strings.venuesCapacity({ count: venue.capacity })}</p>
          <p className="mt-sm text-headline">{strings.venuesPriceFrom({ amount: formatAmount(venue.priceFrom) })}</p>
          <p className="mt-xs text-caption text-on-surface-variant">{strings.venuesRating({ rating: String(venue.rating), count: venue.reviewCount })}</p>
          <button type="button" data-testid="venues.enquireCta" onClick={() => { setSuccess(false); setOpen(true) }} className={`${primaryClass} mt-lg w-full`}>
            {strings.venuesEnquireCta}
          </button>
          <button
            type="button"
            data-testid="venues.save"
            aria-label={saved ? strings.venuesUnsave : strings.venuesSave}
            onClick={() => void update({ savedVenueIds: withToggledId(plan.savedVenueIds, venue.id), venueId: venue.id, destinationId: venue.destinationId })}
            className={`${secondaryClass} mt-md w-full`}
          >
            <AppIcons.heart className="size-icon-sm" />
            {saved ? strings.commonSaved : strings.venuesSave}
          </button>
        </GlassPanel>
      </div>
      <EnquireDialog
        title={strings.venuesEnquireTitle}
        successMessage={strings.venuesEnquireSuccess}
        open={open}
        success={success}
        onClose={() => setOpen(false)}
        onSubmit={(draft) => void send(draft)}
      />
    </Page>
  )
}
