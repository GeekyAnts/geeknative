import { useState } from 'react'
import { qaId } from '#/core/qaId'
import { Link } from '@tanstack/react-router'
import { AppCard } from '#/core/designsystem/AppCard'
import { Chip } from '#/core/designsystem/Chip'
import { Page } from '#/core/designsystem/Page'
import { TravelersStepper } from '#/core/designsystem/TravelersStepper'
import { budgetLabel, categoryIcon, categoryLabel } from '#/features/catalog/labels'
import { budgetBands } from '#/features/catalog/types'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useProfileViewModel } from './useProfileViewModel'

export function ProfileScreen() {
  const viewModel = useProfileViewModel()
  const [name, setName] = useState(viewModel.profile.displayName)
  const [email, setEmail] = useState(viewModel.profile.email)

  return (
    <Page>
      <h1 data-testid="profile.title" className="text-display">
        {strings.profileTitle}
      </h1>

      <div className="flex items-center gap-lg">
        <div className="flex size-thumb items-center justify-center rounded-full bg-primary text-title text-on-primary">
          {viewModel.initials}
        </div>
        <p className="text-title">{viewModel.displayName}</p>
      </div>

      <AppCard>
        <label className="flex flex-col gap-sm text-label text-on-surface-variant">
          {strings.profileName}
          <input
            data-testid="profile.name"
            type="text"
            value={name}
            placeholder={strings.profileNamePlaceholder}
            onChange={(event) => setName(event.target.value)}
            onBlur={(event) => void viewModel.setName(event.target.value)}
            className="min-h-touch-target rounded-lg bg-surface-variant px-md text-body text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>
        <label className="mt-lg flex flex-col gap-sm text-label text-on-surface-variant">
          {strings.profileEmail}
          <input
            data-testid="profile.email"
            type="email"
            value={email}
            placeholder={strings.profileEmailPlaceholder}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={(event) => void viewModel.setEmail(event.target.value)}
            className="min-h-touch-target rounded-lg bg-surface-variant px-md text-body text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>
      </AppCard>

      <AppCard>
        <h2 className="text-title">{strings.profilePreferences}</h2>
        <p className="mt-lg text-label text-on-surface-variant">{strings.profileDefaultTravelers}</p>
        <div className="mt-sm">
          <TravelersStepper
            value={viewModel.profile.defaultTravelers}
            onChange={(value) => void viewModel.setTravelers(value)}
            testId="profile.travelers"
          />
        </div>

        <fieldset className="mt-lg">
          <legend className="text-label text-on-surface-variant">{strings.profileDefaultBudget}</legend>
          <div className="mt-md flex flex-col gap-xs">
            {budgetBands.map((band) => (
              <label
                key={band}
                data-testid={qaId('profile.budget', band)}
                className="flex min-h-touch-target cursor-pointer items-center gap-md rounded-md px-md hover:bg-surface-variant"
              >
                <input
                  type="radio"
                  name="profile-budget"
                  checked={viewModel.profile.budgetBand === band}
                  onChange={() => void viewModel.setBudgetBand(band)}
                  className="size-4 accent-primary"
                />
                <span className="text-body">{budgetLabel(band)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-lg text-label text-on-surface-variant">{strings.profileInterests}</p>
        <div className="mt-md flex flex-wrap gap-sm">
          {viewModel.categories.map((category) => {
            const Icon = categoryIcon[category]
            return (
              <Chip
                key={category}
                selected={viewModel.profile.preferredCategories.includes(category)}
                data-testid={qaId('profile.interest', category)}
                onClick={() => void viewModel.toggleCategory(category)}
              >
                <Icon className="size-icon-sm" />
                {categoryLabel(category)}
              </Chip>
            )
          })}
        </div>
      </AppCard>

      <Link
        to="/settings"
        data-testid="profile.openSettings"
        className="flex min-h-touch-target items-center justify-between rounded-xl bg-surface px-lg text-body shadow-low focus-visible:outline-2 focus-visible:outline-primary"
      >
        {strings.profileOpenSettings}
        <AppIcons.chevronRight className="size-icon-md text-on-surface-variant" />
      </Link>

      <p data-testid="profile.version" className="text-caption text-on-surface-variant">
        {viewModel.versionText}
      </p>
    </Page>
  )
}
