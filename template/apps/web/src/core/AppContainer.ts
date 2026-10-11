import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
export interface AppContainer {
  settingsRepository: SettingsRepository
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so the repository falls back to defaults.
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  return {
    settingsRepository: new LocalStorageSettingsRepository(storage),
  }
}
