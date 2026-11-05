import { Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { primaryButtonClass } from '#/core/designsystem/Buttons'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { Page } from '#/core/designsystem/Page'
import { RestaurantListItem } from '#/core/designsystem/RestaurantListItem'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { animateOut, staggerDelay } from '#/core/motion'
import type { Restaurant } from '#/features/catalog/Catalog'
import type { TodayAvailability } from '#/features/catalog/DemoAvailability'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useSavedViewModel } from './useSavedViewModel'

export function SavedScreen() {
  const viewModel = useSavedViewModel()

  return (
    <Page width="wide" tabs className="pt-xl">
      <ScreenHeader
        overline={strings.savedSubtitle}
        title={strings.savedTitle}
        subtitle={
          viewModel.status === 'ready' && (
            <span data-testid="saved.count" aria-live="polite">
              {strings.savedCount(viewModel.restaurants.length)}
            </span>
          )
        }
      />
      {viewModel.status === 'loading' && (
        <div className="grid gap-lg md:grid-cols-2" aria-busy="true">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-list-image-height rounded-lg" />
          ))}
        </div>
      )}
      {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
      {viewModel.status === 'ready' && viewModel.restaurants.length === 0 && (
        <EmptyState icon={AppIcons.heart} title={strings.savedEmptyTitle} body={strings.savedEmptyBody} testId="saved.empty">
          <Link to="/explore" className={`${primaryButtonClass} mt-sm`}>
            {strings.savedEmptyCta}
          </Link>
        </EmptyState>
      )}
      {viewModel.status === 'ready' && viewModel.restaurants.length > 0 && (
        <ul className="grid gap-lg md:grid-cols-2 desk:grid-cols-3">
          {viewModel.restaurants.map((restaurant, index) => (
            <SavedItem
              key={restaurant.id}
              index={index}
              restaurant={restaurant}
              availability={viewModel.availability(restaurant)}
              onRemove={() => viewModel.remove(restaurant.id)}
            />
          ))}
        </ul>
      )}
    </Page>
  )
}

function SavedItem({
  restaurant,
  availability,
  index,
  onRemove,
}: {
  restaurant: Restaurant
  availability: TodayAvailability
  index: number
  onRemove: () => void
}) {
  const ref = useRef<HTMLLIElement>(null)
  return (
    <li ref={ref} className="motion-safe:animate-fade-up" style={{ animationDelay: staggerDelay(index) }}>
      <RestaurantListItem
        restaurant={restaurant}
        availability={availability}
        saved
        onToggleSaved={() => animateOut(ref.current, onRemove)}
        testId={`saved.item.${restaurant.id}`}
      />
    </li>
  )
}
