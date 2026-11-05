import { Link } from '@tanstack/react-router'
import { AppSerif } from '#/core/designsystem/AppSerif'
import { GoldRule } from '#/core/designsystem/GoldRule'
import { focusRing, onEspressoButtonClass, pressable } from '#/core/designsystem/Buttons'
import { Carousel } from '#/core/designsystem/Carousel'
import { Chip } from '#/core/designsystem/Chip'
import { CollectionCard } from '#/core/designsystem/CollectionCard'
import { DemoNote } from '#/core/designsystem/DemoNote'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { glassIconButtonClass } from '#/core/designsystem/GlassIconButton'
import { Overline } from '#/core/designsystem/Overline'
import { Page } from '#/core/designsystem/Page'
import { PhotoScrim } from '#/core/designsystem/PhotoScrim'
import { RemoteImage } from '#/core/designsystem/RemoteImage'
import { RestaurantCard } from '#/core/designsystem/RestaurantCard'
import { Reveal } from '#/core/designsystem/Reveal'
import { SectionHeader } from '#/core/designsystem/SectionHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { useParallax } from '#/core/motion'
import type { Restaurant } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { cuisineLabel } from '#/features/catalog/Labels'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { firstSentences } from './DiscoverLogic'
import { useDiscoverViewModel } from './useDiscoverViewModel'

type ViewModel = ReturnType<typeof useDiscoverViewModel>

export function DiscoverScreen() {
  const viewModel = useDiscoverViewModel()

  return (
    <div className="flex flex-col gap-xxl pt-lg">
      <Page width="wide" className="pb-0">
        <GreetingBar viewModel={viewModel} />
        {viewModel.status === 'loading' && <DiscoverSkeleton />}
        {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
        {viewModel.status === 'ready' && viewModel.catalog && (
          <>
            <Hero image={viewModel.catalog.heroImage} />
            {viewModel.next && <NextEvening viewModel={viewModel} />}
            <Reveal className="flex flex-col gap-md" aria-labelledby="discover-cuisines">
              <SectionHeader id="discover-cuisines" overline={strings.discoverCuisinesOverline} title={strings.discoverCuisinesTitle} />
              <Carousel className="gap-sm">
                {viewModel.catalog.cuisines.map((cuisine) => (
                  <Chip key={cuisine} testId={`discover.cuisine.${cuisine}`} onClick={() => void viewModel.openCuisine(cuisine)}>
                    {cuisineLabel(cuisine)}
                  </Chip>
                ))}
              </Carousel>
            </Reveal>
            <Reveal index={1} className="flex flex-col gap-md" aria-labelledby="discover-collections">
              <SectionHeader id="discover-collections" overline={strings.discoverCollectionsOverline} title={strings.discoverCollectionsTitle} />
              <Carousel>
                {viewModel.catalog.collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} testId={`discover.collection.${collection.id}`} />
                ))}
              </Carousel>
            </Reveal>
          </>
        )}
      </Page>

      {viewModel.status === 'ready' && viewModel.spotlight && <Spotlight restaurant={viewModel.spotlight} />}

      {viewModel.status === 'ready' && (
        <Page width="wide" tabs>
          {viewModel.recommended.length > 0 && (
            <RestaurantCarousel
              viewModel={viewModel}
              id="discover-recommended"
              overline={strings.discoverRecommendedOverline}
              title={strings.discoverRecommendedTitle}
              restaurants={viewModel.recommended}
              testId={(id) => `discover.recommended.${id}`}
            />
          )}
          <RestaurantCarousel
            viewModel={viewModel}
            id="discover-featured"
            overline={strings.discoverFeaturedOverline}
            title={strings.discoverFeaturedTitle}
            restaurants={viewModel.featured}
            testId={(id) => `discover.featured.${id}`}
            seeAll
          />
          <Reveal>
            <DemoNote />
          </Reveal>
        </Page>
      )}
    </div>
  )
}

function GreetingBar({ viewModel }: { viewModel: ViewModel }) {
  return (
    <header className="flex items-center justify-between gap-md motion-safe:animate-fade-in">
        <div className="flex min-w-0 flex-col gap-xs">
          <Overline>{strings.brandTagline}</Overline>
          <AppSerif role="title" as="h1" data-testid="discover.greeting" className="truncate text-on-background">
            {viewModel.greeting}
          </AppSerif>
        <p className="flex items-center gap-xs text-caption text-on-surface-variant">
          <AppIcons.location className="size-icon-xs" />
          {strings.discoverLocation}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-sm">
        <Link to="/notifications" aria-label={strings.discoverNotifications} data-testid="discover.notifications" className={glassIconButtonClass(false)}>
          <AppIcons.bell className="size-icon-md" />
          {viewModel.hasReminders && (
            <span aria-hidden="true" className="absolute end-sm top-sm size-sm rounded-full border border-surface bg-accent" />
          )}
        </Link>
        <Link
          to="/profile"
          aria-label={strings.discoverOpenProfile}
          data-testid="discover.avatar"
          className={`flex size-touch-target items-center justify-center rounded-full ${pressable} ${focusRing}`}
        >
          <span className="flex size-avatar items-center justify-center rounded-full bg-espresso text-label text-on-espresso ring-2 ring-accent/70">
            {viewModel.initials}
          </span>
        </Link>
      </div>
    </header>
  )
}

function Hero({ image }: { image: string }) {
  const parallax = useParallax<HTMLDivElement>()
  return (
    <section className="relative mb-xl motion-safe:animate-fade-in" aria-labelledby="discover-hero-title">
      <div className="relative h-hero-height overflow-hidden rounded-xl bg-espresso lg:h-hero-wide">
        <div ref={parallax} className="absolute inset-x-0 -top-1/4 h-5/4 will-change-transform">
          <RemoteImage src={image} alt="" priority className="size-full" imageClassName="opacity-60" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-espresso/50" />
        <PhotoScrim />
        <div className="absolute inset-x-0 bottom-0 flex max-w-2xl flex-col gap-md p-xl pb-huge text-on-glass-on-image md:p-xxl md:pb-huge">
          <Overline onImage className="font-bold text-on-glass-on-image">
            {strings.discoverHeroOverline}
          </Overline>
          <GoldRule />
          <AppSerif role="hero" as="h2" id="discover-hero-title">
            {strings.discoverHeroTitle}
          </AppSerif>
          <p className="text-body text-on-glass-on-image/90">{strings.discoverHeroBody}</p>
          <Link
            to="/explore"
            data-testid="discover.heroCta"
            className={`inline-flex min-h-touch-target items-center gap-xs self-start rounded-full border border-glass-border bg-glass-on-image px-lg text-label text-on-glass-on-image backdrop-blur-xl hover:bg-glass-on-image/80 ${pressable} ${focusRing}`}
          >
            {strings.discoverHeroCta}
            <AppIcons.chevronRight className="size-icon-sm" />
          </Link>
        </div>
      </div>
      <Link
        to="/explore"
        state={{ focusSearch: true }}
        data-testid="discover.search"
        className={`absolute inset-x-lg bottom-0 flex h-button translate-y-1/2 items-center gap-md rounded-full px-lg text-body text-on-surface-variant md:inset-x-xxl ${glassClass({ floating: true })} ${pressable} ${focusRing}`}
      >
        <AppIcons.search className="size-icon-md shrink-0 text-on-surface" />
        <span className="truncate">{strings.discoverSearchPlaceholder}</span>
      </Link>
    </section>
  )
}

function NextEvening({ viewModel }: { viewModel: ViewModel }) {
  const next = viewModel.next
  if (!next?.restaurant) return null
  const { reservation, restaurant } = next
  return (
    <Reveal className="flex flex-col gap-sm" aria-label={strings.discoverUpcomingOverline}>
      <Overline>{strings.discoverUpcomingOverline}</Overline>
      <Link
        to="/reservations/$reservationId"
        params={{ reservationId: reservation.id }}
        data-testid="discover.upcoming"
        className={`flex items-center gap-md rounded-lg bg-espresso p-md text-on-espresso hover:shadow-high ${pressable} ${focusRing}`}
      >
        <RemoteImage src={restaurant.heroImage} alt="" className="size-thumbnail shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-xxs">
          <AppSerif role="title" as="p" className="truncate">
            {restaurant.name}
          </AppSerif>
          <p className="text-label">{Formatters.separator(Formatters.dateShort(reservation.date), Formatters.time(reservation.time))}</p>
          <p className="text-caption text-on-espresso/80">{strings.reserveGuestCount(reservation.partySize)}</p>
        </div>
        <AppIcons.chevronRight className="size-icon-md shrink-0 text-accent" />
      </Link>
    </Reveal>
  )
}

function Spotlight({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Reveal className="bg-espresso py-xxl text-on-espresso" aria-labelledby="discover-spotlight-title">
      <div className="mx-auto grid max-w-6xl gap-xl px-lg md:grid-cols-2 md:items-center md:gap-xxxl md:px-xl">
        <div className="flex flex-col gap-md">
          <Overline>{strings.discoverSpotlightOverline}</Overline>
          <AppSerif role="display" as="h2" id="discover-spotlight-title">
            {restaurant.name}
          </AppSerif>
          <AppSerif role="title" italic as="p" className="text-accent">
            {restaurant.tagline}
          </AppSerif>
        </div>
        <RemoteImage src={restaurant.gallery[1] ?? restaurant.heroImage} alt={restaurant.name} className="aspect-4/3 w-full rounded-lg md:row-span-2" />
        <div className="flex flex-col gap-lg">
          <p className="text-body text-on-espresso/80">{firstSentences(restaurant.about)}</p>
          <Link
            to="/restaurants/$restaurantId"
            params={{ restaurantId: restaurant.id }}
            data-testid="discover.spotlight"
            className={`${onEspressoButtonClass} self-start`}
          >
            {strings.discoverSpotlightCta}
          </Link>
        </div>
      </div>
    </Reveal>
  )
}

function RestaurantCarousel({
  viewModel,
  id,
  overline,
  title,
  restaurants,
  testId,
  seeAll = false,
}: {
  viewModel: ViewModel
  id: string
  overline: string
  title: string
  restaurants: Restaurant[]
  testId: (id: string) => string
  seeAll?: boolean
}) {
  return (
    <Reveal className="flex flex-col gap-md" aria-labelledby={id}>
      <SectionHeader id={id} overline={overline} title={title} seeAll={seeAll ? { to: '/explore' } : undefined} />
      <Carousel>
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            availability={viewModel.availability(restaurant.id)}
            saved={viewModel.isSaved(restaurant.id)}
            onToggleSaved={() => viewModel.toggleSaved(restaurant.id)}
            testId={testId(restaurant.id)}
          />
        ))}
      </Carousel>
    </Reveal>
  )
}

function DiscoverSkeleton() {
  return (
    <div className="flex flex-col gap-xl" aria-busy="true">
      <Skeleton className="h-hero-height rounded-xl lg:h-hero-wide" />
      <div className="flex gap-sm overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-chip w-(--spacing-thumbnail) shrink-0 rounded-full" />
        ))}
      </div>
      <div className="flex gap-md overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-featured-card-height w-(--spacing-featured-card-width) shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
