import { Link } from '@tanstack/react-router'
import { strings } from '#/generated/strings'
import type { Restaurant } from '#/features/catalog/Catalog'
import type { TodayAvailability } from '#/features/catalog/DemoAvailability'
import { cuisineLabel } from '#/features/catalog/Labels'
import { AppSerif } from './AppSerif'
import { AvailabilityIndicator } from './AvailabilityIndicator'
import { focusRing } from './Buttons'
import { FavouriteButton } from './FavouriteButton'
import { GoldRule } from './GoldRule'
import { PriceLevel } from './PriceLevel'
import { RatingBadge } from './RatingBadge'
import { RemoteImage } from './RemoteImage'

/** A full-width solid card with the photo on top (DESIGN.md: RestaurantListItem). */
export function RestaurantListItem({
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
    <article className="relative motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy has-[a:active]:scale-97">
      <Link
        to="/restaurants/$restaurantId"
        params={{ restaurantId: restaurant.id }}
        data-testid={testId}
        className={`group flex h-full flex-col overflow-hidden rounded-lg bg-surface text-on-surface hover:shadow-low ${focusRing}`}
      >
        <RemoteImage
          src={restaurant.heroImage}
          alt={restaurant.name}
          className="h-list-image-height w-full"
          imageClassName="motion-safe:transition-transform motion-safe:duration-page motion-safe:ease-standard group-hover:scale-105"
        />
        <div className="flex flex-1 flex-col gap-xs p-lg">
          <GoldRule />
          <AppSerif role="title" as="h3">
            {restaurant.name}
          </AppSerif>
          <p className="flex items-center gap-sm">
            <RatingBadge rating={restaurant.rating} />
            <span className="text-caption text-on-surface-variant">{strings.restaurantReviewCount(restaurant.reviewCount)}</span>
          </p>
          <p className="flex flex-wrap items-center gap-xs text-caption text-on-surface-variant">
            <span>{cuisineLabel(restaurant.cuisine)}</span>
            <span aria-hidden="true">·</span>
            <span>{restaurant.neighbourhood}</span>
            <span aria-hidden="true">·</span>
            <PriceLevel level={restaurant.priceLevel} className="text-caption" />
          </p>
          <p className="line-clamp-2 text-body text-on-surface-variant">{restaurant.tagline}</p>
          <AvailabilityIndicator availability={availability} className="mt-auto pt-xs" />
        </div>
      </Link>
      <FavouriteButton restaurantId={restaurant.id} saved={saved} onToggle={onToggleSaved} className="absolute end-md top-md" />
    </article>
  )
}
