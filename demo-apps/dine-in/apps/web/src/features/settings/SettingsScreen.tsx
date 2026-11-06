import { Page } from '#/core/designsystem/Page'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { TopBar } from '#/core/designsystem/TopBar'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useSettingsViewModel } from './useSettingsViewModel'

export function SettingsScreen() {
  const viewModel = useSettingsViewModel()

  return (
    <div className="min-h-dvh">
      <TopBar title={strings.settingsTitle} fallback="/profile" />
      <Page width="form">
        <ScreenHeader title={strings.settingsTitle} />

        <fieldset data-testid="settings.appearance" className="flex flex-col gap-sm motion-safe:animate-fade-up">
          <legend className="mb-sm text-overline uppercase tracking-(--spacing-tracking) text-accent">{strings.settingsAppearanceTitle}</legend>
          <div className="flex flex-col divide-y divide-outline/40 overflow-hidden rounded-lg bg-surface shadow-low">
            {viewModel.appearanceOptions.map((option) => {
              const checked = viewModel.appearance === option.id
              return (
                <label
                  key={option.id}
                  className="flex min-h-touch-target cursor-pointer items-center gap-md px-lg py-sm text-on-surface hover:bg-surface-variant has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary"
                >
                  <input
                    type="radio"
                    name="appearance"
                    value={option.id}
                    checked={checked}
                    onChange={() => void viewModel.selectAppearance(option.id)}
                    className="sr-only"
                  />
                  <span className="flex-1 text-body">{option.label}</span>
                  <span
                    aria-hidden="true"
                    className={`flex size-xl items-center justify-center rounded-full motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy ${
                      checked ? 'scale-100 bg-espresso text-on-espresso' : 'scale-90 border border-outline'
                    }`}
                  >
                    {checked && <AppIcons.check className="size-icon-xs" />}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <section className="flex flex-col gap-sm motion-safe:animate-fade-up">
          <h2 className="text-overline uppercase tracking-(--spacing-tracking) text-accent">{strings.settingsAboutTitle}</h2>
          <div className="rounded-lg bg-surface px-lg py-md shadow-low">
            <p data-testid="settings.version" className="text-body text-on-surface">
              {viewModel.versionText}
            </p>
          </div>
        </section>
      </Page>
    </div>
  )
}
