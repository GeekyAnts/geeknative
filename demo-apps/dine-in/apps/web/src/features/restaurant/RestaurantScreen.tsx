import { Link } from '@tanstack/react-router'
import { useRef, useState, type ReactNode } from 'react'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { GoldRule } from '#/core/designsystem/GoldRule'
import { AvailabilityIndicator } from '#/core/designsystem/AvailabilityIndicator'
import { primaryButtonClass, secondaryButtonClass } from '#/core/designsystem/Buttons'
import { Carousel } from '#/core/designsystem/Carousel'
import { DemoNote } from '#/core/designsystem/DemoNote'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { FavouriteButton } from '#/core/designsystem/FavouriteButton'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { Overline } from '#/core/designsystem/Overline'
import { Page } from '#/core/designsystem/Page'
import { PhotoScrim } from '#/core/designsystem/PhotoScrim'
import { PriceLevel } from '#/core/designsystem/PriceLevel'
import { RatingBadge } from '#/core/designsystem/RatingBadge'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { Reveal } from '#/core/designsystem/Reveal'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { StickyActionBar } from '#/core/designsystem/StickyActionBar'
import { TopBar } from '#/core/designsystem/TopBar'
import { useParallax } from '#/core/motion'
import type { Restaurant } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { amenityIcon, amenityLabel, availabilityLabel, cuisineLabel } from '#/features/catalog/Labels'
import { directionsUrl, telUrl } from '#/features/reservation/CalendarEvent'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { mapImageStyle, mapPinStyle } from './RestaurantLogic'
import { useRestaurantViewModel, type RestaurantViewModel } from './useRestaurantViewModel'

export function RestaurantScreen({ restaurantId }: { restaurantId: string }) {
  const viewModel = useRestaurantViewModel(restaurantId)
  const { restaurant } = viewModel

  if (viewModel.status === 'loading') return <RestaurantSkeleton />
  if (viewModel.status === 'error' || viewModel.status === 'notFound' || !restaurant) {
    return (
      <div className="min-h-dvh">
        <TopBar />
        <Page width="readable">
          {viewModel.status === 'error' ? (
            <ErrorState onRetry={viewModel.retry} />
          ) : (
            <EmptyState icon={AppIcons.utensils} title={strings.restaurantNotFoundTitle} body={strings.restaurantNotFoundBody} testId="restaurant.notFound" />
          )}
        </Page>
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-action-bar">
      <TopBar
        overlay
        onImage
        title={restaurant.name}
        collapseAfter={280}
        trailing={<FavouriteButton restaurantId={restaurant.id} saved={viewModel.saved} onToggle={viewModel.toggleSaved} />}
      />
      <Gallery restaurant={restaurant} />
      <div className="relative z-10 -mt-xl rounded-t-xl bg-background pt-xl">
        <Page width="readable" className="gap-xxl">
          <TitleBlock viewModel={viewModel} restaurant={restaurant} />
          <Section title={strings.restaurantAbout} testId="restaurant.about">
            <p className="text-body text-on-surface">{restaurant.about}</p>
          </Section>
          <Section title={strings.restaurantAmbience}>
            <p className="text-body text-on-surface">{restaurant.ambience}</p>
            {restaurant.gallery[1] && <RemoteImage src={restaurant.gallery[1]} alt={restaurant.name} className="aspect-video w-full rounded-lg" />}
          </Section>
          {restaurant.signatureDishes.length > 0 && (
            <Section title={strings.restaurantSignatureDishes}>
              <Carousel>
                {restaurant.signatureDishes.map((dish) => (
                  <article key={dish.name} className="flex w-(--spacing-dish-card-width) shrink-0 snap-start flex-col gap-sm">
                    <RemoteImage src={dish.image} alt={dish.name} className="aspect-square w-full rounded-lg" />
                    <AppSerif role="title" as="h3" className="text-on-surface">
                      {dish.name}
                    </AppSerif>
                    <p className="line-clamp-2 text-caption text-on-surface-variant">{dish.description}</p>
                    <p className="text-label text-primary">{Formatters.price(dish.price)}</p>
                  </article>
                ))}
              </Carousel>
            </Section>
          )}
          {restaurant.menuHighlights.length > 0 && (
            <Section title={strings.restaurantMenuHighlights}>
              <ul className="divide-y divide-outline/40 rounded-lg bg-surface px-lg shadow-low">
                {restaurant.menuHighlights.map((item) => (
                  <li key={item.name} className="flex items-start justify-between gap-lg py-md">
                    <div className="flex min-w-0 flex-col gap-xxs">
                      <p className="text-subtitle text-on-surface">{item.name}</p>
                      <p className="text-caption text-on-surface-variant">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-label text-primary">{Formatters.price(item.price)}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title={strings.restaurantHours}>
            <ul data-testid="restaurant.hours" className="flex flex-col rounded-lg bg-surface px-lg py-sm shadow-low">
              {viewModel.hours.map((row) => (
                <li
                  key={row.day}
                  data-testid={`restaurant.hours.${row.day}`}
                  aria-current={row.today ? 'date' : undefined}
                  className={`flex items-center justify-between gap-md py-sm text-body ${row.today ? 'font-semibold text-primary' : 'text-on-surface'}`}
                >
                  <span>{row.name}</span>
                  <span className={row.closed && !row.today ? 'text-on-surface-variant' : ''}>{row.hours}</span>
                </li>
              ))}
            </ul>
          </Section>
          <LocationSection viewModel={viewModel} restaurant={restaurant} />
          {restaurant.amenities.length > 0 && (
            <Section title={strings.restaurantAmenities}>
              <ul className="grid grid-cols-2 gap-md sm:grid-cols-3">
                {restaurant.amenities.map((amenity) => {
                  const Icon = amenityIcon[amenity]
                  return (
                    <li key={amenity} className="flex items-center gap-sm text-label text-on-surface">
                      <Icon className="size-icon-md shrink-0 text-accent" />
                      {amenityLabel(amenity)}
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}
          {restaurant.dressCode && (
            <Section title={strings.restaurantDressCode}>
              <p className="flex items-center gap-sm text-body text-on-surface">
                <AppIcons.dressCode className="size-icon-md shrink-0 text-accent" />
                {restaurant.dressCode}
              </p>
            </Section>
          )}
          <Reviews restaurant={restaurant} />
          <DemoNote />
        </Page>
      </div>
      <StickyActionBar
        summary={
          <>
            <p className="truncate text-label text-on-surface">{strings.restaurantCostForTwo({ price: Formatters.price(restaurant.costForTwo) })}</p>
            <p className="truncate text-caption text-on-surface-variant">{availabilityLabel(viewModel.availability)}</p>
          </>
        }
      >
        <Link to="/restaurants/$restaurantId/reserve" params={{ restaurantId: restaurant.id }} data-testid="restaurant.reserve" className={primaryButtonClass}>
          {strings.restaurantReserve}
        </Link>
      </StickyActionBar>
    </div>
  )
}

function Gallery({ restaurant }: { restaurant: Restaurant }) {
  const parallax = useParallax<HTMLDivElement>()
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const photos = restaurant.gallery.length > 0 ? restaurant.gallery : [restaurant.heroImage]

  const onScroll = () => {
    const element = scroller.current
    if (!element || element.clientWidth === 0) return
    setIndex(Math.min(photos.length - 1, Math.round(Math.abs(element.scrollLeft) / element.clientWidth)))
  }

  return (
    <section className="relative h-detail-hero-height overflow-hidden bg-espresso lg:h-hero-wide" aria-label={restaurant.name}>
      <div ref={parallax} className="absolute inset-0 origin-top will-change-transform">
        <div
          ref={scroller}
          data-testid="restaurant.gallery"
          onScroll={onScroll}
          className="scrollbar-none flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
        >
          {photos.map((photo, position) => (
            <RemoteImage
              key={photo}
              src={photo}
              alt={strings.restaurantGalleryPosition({ index: position + 1, total: photos.length })}
              priority={position === 0}
              className="size-full shrink-0 snap-center"
            />
          ))}
        </div>
      </div>
      <PhotoScrim className="pointer-events-none" />
      {photos.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-xxl flex justify-center gap-xs" aria-hidden="true">
            {photos.map((photo, position) => (
              <span
                key={photo}
                className={`h-xs rounded-full motion-safe:transition-all motion-safe:duration-normal motion-safe:ease-standard ${
                  position === index ? 'w-lg bg-on-glass-on-image' : 'w-xs bg-on-glass-on-image/50'
                }`}
              />
            ))}
          </div>
          <p
            aria-live="polite"
            className="pointer-events-none absolute bottom-xxl end-lg rounded-full border border-glass-border bg-glass-on-image px-md py-xxs text-caption text-on-glass-on-image backdrop-blur-xl"
          >
            {strings.restaurantGalleryPosition({ index: index + 1, total: photos.length })}
          </p>
        </>
      )}
    </section>
  )
}

function TitleBlock({ viewModel, restaurant }: { viewModel: RestaurantViewModel; restaurant: Restaurant }) {
  return (
    <header className="flex flex-col gap-sm motion-safe:animate-fade-up">
      <Overline>{cuisineLabel(restaurant.cuisine)}</Overline>
      <GoldRule />
      <AppSerif role="headline" as="h1" data-testid="restaurant.name" className="text-on-background">
        {restaurant.name}
      </AppSerif>
      <AppSerif role="title" italic as="p" className="text-on-surface-variant">
        {restaurant.tagline}
      </AppSerif>
      <p className="mt-xs flex flex-wrap items-center gap-x-md gap-y-xs text-label text-on-surface">
        <RatingBadge rating={restaurant.rating} />
        <span className="text-on-surface-variant">{strings.restaurantReviewCount(restaurant.reviewCount)}</span>
        <PriceLevel level={restaurant.priceLevel} />
        <span className="text-on-surface-variant">{strings.restaurantCostForTwo({ price: Formatters.price(restaurant.costForTwo) })}</span>
      </p>
      <p className="flex items-center gap-xs text-caption text-on-surface-variant">
        <AppIcons.location className="size-icon-sm shrink-0 text-accent" />
        {Formatters.separator(restaurant.neighbourhood, Formatters.distance(restaurant.distanceKm))}
      </p>
      <AvailabilityIndicator availability={viewModel.availability} />
    </header>
  )
}

function LocationSection({ viewModel, restaurant }: { viewModel: RestaurantViewModel; restaurant: Restaurant }) {
  const map = viewModel.map
  return (
    <Section title={strings.restaurantLocation}>
      {map && (
        <div data-testid="restaurant.map" className="@container relative h-list-image-height overflow-hidden rounded-lg bg-surface-variant shadow-low">
          <img src={map.url} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-x-0 aspect-square w-full max-w-none" style={mapImageStyle(map)} />
          <span
            className="absolute flex size-touch-target -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-espresso shadow-high"
            style={mapPinStyle(map)}
          >
            <AppIcons.location className="size-icon-lg" />
          </span>
          <p className={`absolute bottom-xs end-xs rounded-sm px-xs text-caption text-on-surface ${glassClass({ strong: true })}`}>{strings.restaurantMapAttribution}</p>
        </div>
      )}
      <p className="text-body text-on-surface">{restaurant.address}</p>
      <div className="grid grid-cols-2 gap-md">
        <a
          href={directionsUrl(restaurant)}
          target="_blank"
          rel="noreferrer"
          data-testid="restaurant.directions"
          className={`${secondaryButtonClass} px-md`}
        >
          <AppIcons.directions className="size-icon-sm shrink-0" />
          {strings.restaurantDirections}
        </a>
        <a href={telUrl(restaurant.phone)} data-testid="restaurant.call" className={`${secondaryButtonClass} px-md`}>
          <AppIcons.phone className="size-icon-sm shrink-0" />
          {strings.restaurantCall}
        </a>
      </div>
    </Section>
  )
}

function Reviews({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.reviews.length === 0) return null
  return (
    <Reveal as="section" className="flex flex-col gap-lg" aria-labelledby="restaurant-reviews">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <AppSerif role="title" as="h2" id="restaurant-reviews" className="text-on-background">
          {strings.restaurantReviews}
        </AppSerif>
        <p className="flex items-baseline gap-sm">
          <AppSerif role="display" as="span" className="text-on-background">
            {Formatters.rating(restaurant.rating)}
          </AppSerif>
          <span className="text-caption text-on-surface-variant">{strings.restaurantReviewCount(restaurant.reviewCount)}</span>
        </p>
      </div>
      <Carousel>
        {restaurant.reviews.map((review) => (
          <figure
            key={`${review.author}-${review.date}`}
            className="flex w-(--spacing-featured-card-width) shrink-0 snap-start flex-col gap-md rounded-lg bg-surface p-lg shadow-low"
          >
            <AppIcons.quote className="size-icon-lg text-accent" />
            <blockquote>
              <AppSerif role="title" italic as="p" className="text-on-surface">
                {review.text}
              </AppSerif>
            </blockquote>
            <figcaption className="mt-auto flex items-end justify-between gap-md">
              <span className="flex flex-col">
                <span className="text-label text-on-surface">{review.author}</span>
                <span className="text-caption text-on-surface-variant">{Formatters.dateShort(review.date)}</span>
              </span>
              <span className="flex gap-xxs text-accent">
                <span className="sr-only">{strings.restaurantRatingLabel({ rating: Formatters.rating(review.rating) })}</span>
                {[1, 2, 3, 4, 5].map((star) =>
                  star <= Math.round(review.rating) ? (
                    <AppIcons.starFilled key={star} aria-hidden="true" className="size-icon-xs" />
                  ) : (
                    <AppIcons.star key={star} aria-hidden="true" className="size-icon-xs" />
                  ),
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </Carousel>
    </Reveal>
  )
}

function Section({ title, testId, children }: { title: string; testId?: string; children: ReactNode }) {
  return (
    <Reveal as="section" className="flex flex-col gap-md" data-testid={testId}>
      <AppSerif role="title" as="h2" className="text-on-background">
        {title}
      </AppSerif>
      {children}
    </Reveal>
  )
}

function RestaurantSkeleton() {
  return (
    <div className="min-h-dvh" aria-busy="true">
      <TopBar overlay onImage />
      <Skeleton className="h-detail-hero-height w-full lg:h-hero-wide" />
      <Page width="readable" className="pt-xl">
        <div className="flex flex-col gap-md">
          <Skeleton className="h-lg w-1/3 rounded-sm" />
          <Skeleton className="h-xxl w-2/3 rounded-sm" />
          <Skeleton className="h-lg w-1/2 rounded-sm" />
        </div>
        <Skeleton className="h-list-image-height w-full rounded-lg" />
      </Page>
    </div>
  )
}
