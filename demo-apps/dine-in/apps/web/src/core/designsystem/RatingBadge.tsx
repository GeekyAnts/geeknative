import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { Formatters } from '#/features/catalog/Formatters'

/** `starFilled` in `accent` + the rating with one decimal. */
export function RatingBadge({ rating, className = '' }: { rating: number; className?: string }) {
  const text = Formatters.rating(rating)
  return (
    <span className={`inline-flex items-center gap-xxs ${className}`}>
      <AppIcons.starFilled className="size-icon-sm text-accent" />
      <span aria-hidden="true" className="text-label">
        {text}
      </span>
      <span className="sr-only">{strings.restaurantRatingLabel({ rating: text })}</span>
    </span>
  )
}
