import { Carousel } from '#/core/designsystem/Carousel'
import { Chip } from '#/core/designsystem/Chip'
import { DemoNote } from '#/core/designsystem/DemoNote'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { ErrorState } from '#/core/designsystem/ErrorState'
import { focusRing } from '#/core/designsystem/Buttons'
import { glassClass } from '#/core/designsystem/GlassSurface'
import { GlassIconButton } from '#/core/designsystem/GlassIconButton'
import { Overline } from '#/core/designsystem/Overline'
import { Page } from '#/core/designsystem/Page'
import { RestaurantCard } from '#/core/designsystem/RestaurantCard'
import { RestaurantGridItem } from '#/core/designsystem/RestaurantGridItem'
import { RestaurantListItem } from '#/core/designsystem/RestaurantListItem'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { Skeleton } from '#/core/designsystem/Skeleton'
import { staggerDelay, useScrolledPast } from '#/core/motion'
import { collectionTitle, cuisineLabel } from '#/features/catalog/Labels'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { exploreSorts, type ExploreSort } from './ExploreFilters'
import { FiltersSheet } from './FiltersSheet'
import { useExploreViewModel, type ExploreArrival, type ExploreViewModel } from './useExploreViewModel'

const sortLabel = (sort: ExploreSort) =>
  sort === 'popularity' ? strings.exploreSortPopularity : sort === 'rating' ? strings.exploreSortRating : strings.exploreSortDistance

export function ExploreScreen({ search }: { search: ExploreArrival }) {
  const viewModel = useExploreViewModel(search)

  return (
    <Page width="wide" tabs className="pt-lg">
      <ScreenHeader overline={strings.exploreSubtitle} title={strings.exploreTitle} />
      <SearchRow viewModel={viewModel} />
      {viewModel.status === 'loading' && (
        <div className="flex flex-col gap-lg" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-list-image-height rounded-lg" />
          ))}
        </div>
      )}
      {viewModel.status === 'error' && <ErrorState onRetry={viewModel.retry} />}
      {viewModel.status === 'ready' && (
        <>
          <QuickFilters viewModel={viewModel} />
          <ResultsBar viewModel={viewModel} />
          {viewModel.showFeatured && (
            <section className="flex flex-col gap-md motion-safe:animate-fade-up" aria-label={strings.exploreFeatured}>
              <Overline>{strings.exploreFeatured}</Overline>
              <Carousel>
                {viewModel.featured.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    availability={viewModel.availability(restaurant.id)}
                    saved={viewModel.isSaved(restaurant.id)}
                    onToggleSaved={() => viewModel.toggleSaved(restaurant.id)}
                  />
                ))}
              </Carousel>
            </section>
          )}
          <Results viewModel={viewModel} />
          <DemoNote />
        </>
      )}
      <FiltersSheet viewModel={viewModel} />
    </Page>
  )
}

function SearchRow({ viewModel }: { viewModel: ExploreViewModel }) {
  const stuck = useScrolledPast(96)
  return (
    <div
      className={`sticky top-0 z-20 -mx-lg flex items-center gap-sm px-lg py-sm motion-safe:transition-colors motion-safe:duration-normal motion-safe:ease-standard md:-mx-xl md:px-xl ${
        stuck ? 'bg-glass-strong backdrop-blur-xl' : ''
      }`}
    >
      <label className={`flex h-button min-w-0 flex-1 items-center gap-sm rounded-full ps-lg pe-xs focus-within:border-primary ${glassClass({ strong: stuck })}`}>
        <AppIcons.search className="size-icon-md shrink-0 text-on-surface-variant" />
        <span className="sr-only">{strings.exploreSearchPlaceholder}</span>
        <input
          ref={viewModel.searchInput}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          data-testid="explore.search"
          value={viewModel.searchText}
          onChange={(event) => viewModel.setSearchText(event.target.value)}
          placeholder={strings.exploreSearchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant"
        />
        {viewModel.searchText !== '' && (
          <button
            type="button"
            data-testid="explore.clearSearch"
            aria-label={strings.exploreClearSearch}
            onClick={viewModel.clearSearch}
            className={`inline-flex size-touch-target shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface ${focusRing}`}
          >
            <AppIcons.close className="size-icon-sm" />
          </button>
        )}
      </label>
      <GlassIconButton icon={AppIcons.filter} label={strings.exploreFilters} testId="explore.filtersButton" onClick={viewModel.sheet.show}>
        {viewModel.filterCount > 0 && (
          <span className="absolute -end-xxs -top-xxs flex size-xl items-center justify-center rounded-full bg-accent text-caption text-on-accent motion-safe:animate-fade-in">
            {viewModel.filterCount}
          </span>
        )}
      </GlassIconButton>
    </div>
  )
}

function QuickFilters({ viewModel }: { viewModel: ExploreViewModel }) {
  const { filters } = viewModel
  return (
    <Carousel className="-my-sm gap-sm">
      {filters.collection && (
        <Chip
          selected
          testId="explore.chip.collection"
          onClick={viewModel.removeCollection}
          trailing={
            <>
              <AppIcons.close className="size-icon-sm" />
              <span className="sr-only">{strings.exploreRemoveFilter}</span>
            </>
          }
        >
          {collectionTitle(filters.collection)}
        </Chip>
      )}
      <Chip selected={filters.availableToday} testId="explore.chip.availableToday" onClick={viewModel.toggleAvailableToday}>
        {strings.exploreFilterAvailableToday}
      </Chip>
      {viewModel.cuisines.map((cuisine) => (
        <Chip key={cuisine} selected={filters.cuisines.has(cuisine)} testId={`explore.chip.cuisine.${cuisine}`} onClick={() => viewModel.toggleCuisine(cuisine)}>
          {cuisineLabel(cuisine)}
        </Chip>
      ))}
    </Carousel>
  )
}

function ResultsBar({ viewModel }: { viewModel: ExploreViewModel }) {
  const grid = viewModel.viewMode === 'grid'
  return (
    <div className="flex items-center justify-between gap-sm">
      <p data-testid="explore.resultsCount" aria-live="polite" className="text-label text-on-surface-variant">
        {strings.exploreResults(viewModel.results.length)}
      </p>
      <div className="flex items-center gap-sm">
        <label className={`relative inline-flex h-chip items-center gap-xs rounded-full border border-outline bg-surface ps-md pe-md text-label text-on-surface focus-within:border-primary`}>
          <AppIcons.sort className="size-icon-sm shrink-0" />
          <span className="sr-only">{strings.exploreSort}</span>
          <select
            data-testid="explore.sortButton"
            value={viewModel.sort}
            onChange={(event) => viewModel.setSort(event.target.value as ExploreSort)}
            className="min-h-touch-target cursor-pointer appearance-none bg-transparent pe-lg outline-none"
          >
            {exploreSorts.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabel(sort)}
              </option>
            ))}
          </select>
          <AppIcons.chevronDown className="pointer-events-none absolute end-sm size-icon-xs" />
        </label>
        <GlassIconButton
          icon={grid ? AppIcons.list : AppIcons.grid}
          label={grid ? strings.exploreViewList : strings.exploreViewGrid}
          testId="explore.viewToggle"
          onClick={viewModel.toggleViewMode}
        />
      </div>
    </div>
  )
}

function Results({ viewModel }: { viewModel: ExploreViewModel }) {
  if (viewModel.results.length === 0) {
    const filtersActive = viewModel.filterCount > 0
    return (
      <EmptyState
        icon={AppIcons.search}
        title={strings.exploreEmptyTitle}
        body={strings.exploreEmptyBody}
        testId="explore.empty"
        action={filtersActive ? strings.exploreFilterClear : undefined}
        onAction={filtersActive ? viewModel.clearAll : undefined}
        actionTestId="explore.clearFilters"
      />
    )
  }
  const grid = viewModel.viewMode === 'grid'
  return (
    <ul
      key={`${viewModel.resultsKey}|${viewModel.viewMode}`}
      className={grid ? 'grid grid-cols-2 gap-x-md gap-y-xl md:grid-cols-3 desk:grid-cols-4' : 'grid gap-lg md:grid-cols-2 lg:grid-cols-3'}
    >
      {viewModel.results.map((restaurant, index) => (
        <li key={restaurant.id} className="motion-safe:animate-fade-up" style={{ animationDelay: staggerDelay(index) }}>
          {grid ? (
            <RestaurantGridItem
              restaurant={restaurant}
              saved={viewModel.isSaved(restaurant.id)}
              onToggleSaved={() => viewModel.toggleSaved(restaurant.id)}
              testId={`explore.result.${restaurant.id}`}
            />
          ) : (
            <RestaurantListItem
              restaurant={restaurant}
              availability={viewModel.availability(restaurant.id)}
              saved={viewModel.isSaved(restaurant.id)}
              onToggleSaved={() => viewModel.toggleSaved(restaurant.id)}
              testId={`explore.result.${restaurant.id}`}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
