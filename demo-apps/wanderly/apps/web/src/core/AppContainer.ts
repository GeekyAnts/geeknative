import { JsonCatalogRepository } from '#/features/catalog/JsonCatalogRepository'
import type { CatalogRepository } from '#/features/catalog/CatalogRepository'
import { LocalStorageProfileRepository } from '#/features/profile/LocalStorageProfileRepository'
import type { ProfileRepository } from '#/features/profile/ProfileRepository'
import { LocalStorageSavedRepository } from '#/features/saved/LocalStorageSavedRepository'
import type { SavedRepository } from '#/features/saved/SavedRepository'
import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'
import { LocalStorageTripRepository } from '#/features/tripPlanner/LocalStorageTripRepository'
import type { TripRepository } from '#/features/tripPlanner/TripRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
export interface AppContainer {
  settingsRepository: SettingsRepository
  catalogRepository: CatalogRepository
  savedRepository: SavedRepository
  tripRepository: TripRepository
  profileRepository: ProfileRepository
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so repositories fall back to defaults.
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  return {
    settingsRepository: new LocalStorageSettingsRepository(storage),
    catalogRepository: new JsonCatalogRepository(),
    savedRepository: new LocalStorageSavedRepository(storage),
    tripRepository: new LocalStorageTripRepository(storage),
    profileRepository: new LocalStorageProfileRepository(storage),
  }
}
