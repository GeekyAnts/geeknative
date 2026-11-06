import { Link } from '@tanstack/react-router'
import type { Restaurant } from '#/features/catalog/Catalog'
import type { TodayAvailability } from '#/features/catalog/DemoAvailability'
import { Formatters } from '#/features/catalog/Formatters'
import { cuisineLabel } from '#/features/catalog/Labels'
import { AppSerif } from './AppSerif'
import { AvailabilityIndicator } from './AvailabilityIndicator'
import { focusRing } from './Buttons'
import { FavouriteButton } from './FavouriteButton'
import { glassClass } from './GlassSurface'
import { Overline } from './Overline'
import { PhotoScrim } from './PhotoScrim'
import { PriceLevel } from './PriceLevel'
import { RemoteImage } from './RemoteImage'

/** The tall featured photo card used in carousels (DESIGN.md: RestaurantCard). */
export function RestaurantCard({
  restaurant,
  availability,
  saved,
  onToggleSaved,
  testId,
}: {
  restaurant: Restaurant
  availability: TodayAvailability
  saved: boolean
  onToggleSaved: () => void
  testId?: string
}) {
  return (
    <article className="relative h-featured-card-height w-(--spacing-featured-card-width) shrink-0 snap-start motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy has-[a:active]:scale-97">
      <Link
        to="/restaurants/$restaurantId"
        params={{ restaurantId: restaurant.id }}
        data-testid={testId}
        className={`group block size-full overflow-hidden rounded-xl bg-espresso ${focusRing}`}
      >
        <RemoteImage
          src={restaurant.heroImage}
          alt={restaurant.name}
          className="absolute inset-0 rounded-xl"
          imageClassName="motion-safe:transition-transform motion-safe:duration-page motion-safe:ease-standard group-hover:scale-105"
        />
        <PhotoScrim />
        <div className={`absolute inset-x-md bottom-md flex flex-col gap-xs rounded-lg p-md text-on-surface ${glassClass({ strong: true })}`}>
          <Overline>{cuisineLabel(restaurant.cuisine)}</Overline>
          <AppSerif role="title" as="h3">
            {restaurant.name}
          </AppSerif>
          <p className="flex flex-wrap items-center gap-xs text-caption text-on-surface-variant">
            <span>{restaurant.neighbourhood}</span>
            <span aria-hidden="true">·</span>
            <span>{Formatters.rating(restaurant.rating)}</span>
            <span aria-hidden="true">·</span>
            <PriceLevel level={restaurant.priceLevel} className="text-caption" />
          </p>
          <AvailabilityIndicator availability={availability} />
        </div>
      </Link>
      <FavouriteButton restaurantId={restaurant.id} saved={saved} onToggle={onToggleSaved} className="absolute end-md top-md" />
    </article>
  )
}
