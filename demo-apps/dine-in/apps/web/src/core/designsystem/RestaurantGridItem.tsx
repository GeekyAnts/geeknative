import { Link } from '@tanstack/react-router'
import type { Restaurant } from '#/features/catalog/Catalog'
import { AppSerif } from './AppSerif'
import { focusRing } from './Buttons'
import { FavouriteButton } from './FavouriteButton'
import { PriceLevel } from './PriceLevel'
import { RatingBadge } from './RatingBadge'
import { RemoteImage } from './RemoteImage'

/** A square photo with the name, rating and price (DESIGN.md: RestaurantGridItem). */
export function RestaurantGridItem({
  restaurant,
  saved,
  onToggleSaved,
  testId,
}: {
  restaurant: Restaurant
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
        className={`group flex flex-col gap-sm rounded-lg ${focusRing}`}
      >
        <RemoteImage
          src={restaurant.heroImage}
          alt={restaurant.name}
          className="aspect-square w-full rounded-lg"
          imageClassName="motion-safe:transition-transform motion-safe:duration-page motion-safe:ease-standard group-hover:scale-105"
        />
        <AppSerif role="title" as="h3" className="line-clamp-2 text-on-background">
          {restaurant.name}
        </AppSerif>
        <p className="flex items-center gap-sm">
          <RatingBadge rating={restaurant.rating} />
          <PriceLevel level={restaurant.priceLevel} />
        </p>
      </Link>
      <FavouriteButton restaurantId={restaurant.id} saved={saved} onToggle={onToggleSaved} className="absolute end-sm top-sm" />
    </article>
  )
}
