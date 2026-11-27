import { AppCard } from '#/core/designsystem/AppCard'
import { Page } from '#/core/designsystem/Page'
import { strings } from '#/generated/strings'
import { useSettingsViewModel } from './useSettingsViewModel'

export function SettingsScreen() {
  const viewModel = useSettingsViewModel()

  return (
    <Page>
      <h1 className="text-display">{strings.settingsTitle}</h1>

      <AppCard>
        <fieldset data-testid="settings.appearance">
          <legend className="text-label text-on-surface-variant">{strings.settingsAppearanceTitle}</legend>
          <div className="mt-md flex flex-col gap-xs">
            {viewModel.appearanceOptions.map((option) => (
              <label
                key={option.id}
                className="flex min-h-touch-target cursor-pointer items-center gap-md rounded-md px-md hover:bg-surface-variant"
              >
                <input
                  type="radio"
                  name="appearance"
                  value={option.id}
                  checked={viewModel.appearance === option.id}
                  onChange={() => void viewModel.selectAppearance(option.id)}
                  className="size-4 accent-primary"
                />
                <span className="text-body">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AppCard>

      <AppCard>
        <div className="flex min-h-touch-target items-center justify-between gap-md">
          <div>
            <h2 className="text-label text-on-surface-variant">{strings.settingsNotificationsTitle}</h2>
            <p className="mt-xs text-body">{strings.settingsNotificationsBody}</p>
          </div>
          <input
            type="checkbox"
            role="switch"
            data-testid="settings.notifications"
            aria-label={strings.settingsNotificationsTitle}
            checked={viewModel.notificationsEnabled}
            onChange={(event) => void viewModel.selectNotifications(event.target.checked)}
            className="size-4 accent-primary"
          />
        </div>
      </AppCard>

      <AppCard>
        <h2 className="text-label text-on-surface-variant">{strings.settingsAboutTitle}</h2>
        <p data-testid="settings.version" className="mt-sm text-body">
          {viewModel.versionText}
        </p>
      </AppCard>
    </Page>
  )
}
