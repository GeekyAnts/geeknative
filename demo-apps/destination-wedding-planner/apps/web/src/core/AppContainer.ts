import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'
import { LocalStorageWeddingRepository } from '#/features/wedding/LocalStorageWeddingRepository'
import type { WeddingRepository } from '#/features/wedding/WeddingRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
export interface AppContainer {
  settingsRepository: SettingsRepository
  weddingRepository: WeddingRepository
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so the repository falls back to defaults.
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  return {
    settingsRepository: new LocalStorageSettingsRepository(storage),
    weddingRepository: new LocalStorageWeddingRepository(storage),
  }
}
