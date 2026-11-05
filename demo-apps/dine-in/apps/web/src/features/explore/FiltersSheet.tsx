import type { ReactNode } from 'react'
import { textButtonClass } from '#/core/designsystem/Buttons'
import { Chip } from '#/core/designsystem/Chip'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { Sheet } from '#/core/designsystem/Sheet'
import { Switch } from '#/core/designsystem/Switch'
import { Formatters } from '#/features/catalog/Formatters'
import { cuisineLabel } from '#/features/catalog/Labels'
import { strings } from '#/generated/strings'
import { priceLevelOptions, ratingOptions, toggled } from './ExploreFilters'
import type { ExploreViewModel } from './useExploreViewModel'

const ratingTestValue = (rating: number) => String(Math.round(rating * 10))

/** Cuisine, neighbourhood, price, rating and availability. Changes apply only with the apply button. */
export function FiltersSheet({ viewModel }: { viewModel: ExploreViewModel }) {
  const { sheet } = viewModel
  const draft = sheet.draft

  return (
    <Sheet
      open={sheet.open}
      onClose={sheet.dismiss}
      title={strings.exploreFilters}
      footer={
        <div className="flex items-center justify-between gap-md">
          <button type="button" data-testid="explore.filters.clear" onClick={sheet.clear} className={`${textButtonClass} text-primary`}>
            {strings.exploreFilterClear}
          </button>
          <PrimaryButton testId="explore.filters.apply" onClick={sheet.apply} disabled={sheet.count === 0} className="flex-1 md:flex-none">
            {strings.exploreFilterApply(sheet.count)}
          </PrimaryButton>
        </div>
      }
    >
      {draft && (
        <div className="flex flex-col gap-xl">
          <Section title={strings.exploreFilterCuisine}>
            {viewModel.cuisines.map((cuisine) => (
              <Chip
                key={cuisine}
                selected={draft.cuisines.has(cuisine)}
                testId={`explore.filters.cuisine.${cuisine}`}
                onClick={() => sheet.update({ ...draft, cuisines: toggled(draft.cuisines, cuisine) })}
              >
                {cuisineLabel(cuisine)}
              </Chip>
            ))}
          </Section>
          <Section title={strings.exploreFilterNeighbourhood}>
            {viewModel.neighbourhoods.map((neighbourhood, index) => (
              <Chip
                key={neighbourhood}
                selected={draft.neighbourhoods.has(neighbourhood)}
                testId={`explore.filters.neighbourhood.${index}`}
                onClick={() => sheet.update({ ...draft, neighbourhoods: toggled(draft.neighbourhoods, neighbourhood) })}
              >
                {neighbourhood}
              </Chip>
            ))}
          </Section>
          <Section title={strings.exploreFilterPrice}>
            {priceLevelOptions.map((level) => (
              <Chip
                key={level}
                selected={draft.priceLevels.has(level)}
                testId={`explore.filters.price.${level}`}
                aria-label={strings.restaurantPriceLabel({ level })}
                onClick={() => sheet.update({ ...draft, priceLevels: toggled(draft.priceLevels, level) })}
              >
                {Formatters.priceSymbol().repeat(level)}
              </Chip>
            ))}
          </Section>
          <Section title={strings.exploreFilterRating}>
            <Chip selected={draft.minRating === null} testId="explore.filters.rating.any" onClick={() => sheet.update({ ...draft, minRating: null })}>
              {strings.exploreFilterRatingAny}
            </Chip>
            {ratingOptions.map((rating) => (
              <Chip
                key={rating}
                selected={draft.minRating === rating}
                testId={`explore.filters.rating.${ratingTestValue(rating)}`}
                onClick={() => sheet.update({ ...draft, minRating: rating })}
              >
                {strings.exploreFilterRatingMin({ rating: Formatters.rating(rating) })}
              </Chip>
            ))}
          </Section>
          <label className="flex min-h-touch-target cursor-pointer items-center justify-between gap-md rounded-lg bg-surface px-lg py-sm">
            <span className="text-subtitle">{strings.exploreFilterAvailableToday}</span>
            <Switch
              testId="explore.filters.availableToday"
              checked={draft.availableToday}
              onChange={() => sheet.update({ ...draft, availableToday: !draft.availableToday })}
            />
          </label>
        </div>
      )}
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-sm">
      <legend className="mb-sm text-overline uppercase tracking-(--spacing-tracking) text-accent">{title}</legend>
      <div className="flex flex-wrap gap-x-sm">{children}</div>
    </fieldset>
  )
}
