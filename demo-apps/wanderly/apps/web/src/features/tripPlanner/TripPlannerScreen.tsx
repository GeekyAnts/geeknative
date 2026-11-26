import { qaId } from '#/core/qaId'
import { Page } from '#/core/designsystem/Page'
import { AppCard } from '#/core/designsystem/AppCard'
import { Chip } from '#/core/designsystem/Chip'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { TravelersStepper } from '#/core/designsystem/TravelersStepper'
import { budgetLabel, categoryIcon, categoryLabel } from '#/features/catalog/labels'
import { budgetBands } from '#/features/catalog/types'
import { strings } from '#/generated/strings'
import { useTripPlannerViewModel } from './useTripPlannerViewModel'

export function TripPlannerScreen() {
  const viewModel = useTripPlannerViewModel()

  return (
    <Page>
      <h1 className="text-display">{strings.plannerTitle}</h1>

      <AppCard>
        <label className="flex flex-col gap-sm text-label text-on-surface-variant">
          {strings.plannerDestination}
          <select
            data-testid="planner.destination"
            value={viewModel.destinationId}
            onChange={(event) => viewModel.setDestinationId(event.target.value)}
            className="min-h-touch-target rounded-lg bg-surface-variant px-md text-body text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="">{strings.plannerDestinationPlaceholder}</option>
            {viewModel.destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </label>
        {viewModel.error === 'destination' ? (
          <p className="mt-sm text-body text-error">{strings.plannerDestinationError}</p>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="text-label text-on-surface-variant">{strings.plannerDates}</p>
        <div className="mt-md grid gap-md sm:grid-cols-2">
          <label className="flex flex-col gap-sm text-label">
            {strings.plannerStartDate}
            <input
              data-testid="planner.startDate"
              type="date"
              value={viewModel.startDate}
              onChange={(event) => viewModel.setStartDate(event.target.value)}
              className="min-h-touch-target rounded-lg bg-surface-variant px-md text-body focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
          <label className="flex flex-col gap-sm text-label">
            {strings.plannerEndDate}
            <input
              data-testid="planner.endDate"
              type="date"
              value={viewModel.endDate}
              onChange={(event) => viewModel.setEndDate(event.target.value)}
              className="min-h-touch-target rounded-lg bg-surface-variant px-md text-body focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
        </div>
        {viewModel.error === 'date' ? (
          <p data-testid="planner.dateError" className="mt-sm text-body text-error">
            {strings.plannerDateError}
          </p>
        ) : null}
        {viewModel.error === 'range' ? (
          <p className="mt-sm text-body text-error">{strings.plannerRangeError}</p>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="text-label text-on-surface-variant">{strings.plannerTravelers}</p>
        <div className="mt-sm">
          <TravelersStepper
            value={viewModel.travelers}
            onChange={(value) => viewModel.setTravelers(value)}
            testId="planner.travelers"
          />
        </div>
      </AppCard>

      <AppCard>
        <fieldset>
          <legend className="text-label text-on-surface-variant">{strings.plannerBudget}</legend>
          <div className="mt-md flex flex-col gap-xs">
            {budgetBands.map((band) => (
              <label
                key={band}
                data-testid={qaId('planner.budget', band)}
                className="flex min-h-touch-target cursor-pointer items-center gap-md rounded-md px-md hover:bg-surface-variant"
              >
                <input
                  type="radio"
                  name="planner-budget"
                  checked={viewModel.budgetBand === band}
                  onChange={() => viewModel.setBudgetBand(band)}
                  className="size-4 accent-primary"
                />
                <span className="text-body">{budgetLabel(band)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AppCard>

      <AppCard>
        <p className="text-label text-on-surface-variant">{strings.plannerInterests}</p>
        <div className="mt-md flex flex-wrap gap-sm">
          {viewModel.categories.map((category) => {
            const Icon = categoryIcon[category]
            return (
              <Chip
                key={category}
                selected={viewModel.interests.includes(category)}
                data-testid={qaId('planner.interest', category)}
                onClick={() => viewModel.toggleInterest(category)}
              >
                <Icon className="size-icon-sm" />
                {categoryLabel(category)}
              </Chip>
            )
          })}
        </div>
      </AppCard>

      <PrimaryButton data-testid="planner.generate" onClick={() => void viewModel.generate()}>
        {strings.plannerGenerate}
      </PrimaryButton>
    </Page>
  )
}
