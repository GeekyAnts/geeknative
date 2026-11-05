import type { AuthRepository } from '#/features/auth/AuthRepository'
import { LocalStorageAuthRepository } from '#/features/auth/LocalStorageAuthRepository'
import { BundledCatalogRepository } from '#/features/catalog/BundledCatalogRepository'
import type { CatalogRepository } from '#/features/catalog/CatalogRepository'
import type { ExploreRepository } from '#/features/explore/ExploreRepository'
import { LocalStorageExploreRepository } from '#/features/explore/LocalStorageExploreRepository'
import { LocalStoragePreferencesRepository } from '#/features/profile/LocalStoragePreferencesRepository'
import type { PreferencesRepository } from '#/features/profile/PreferencesRepository'
import { LocalStorageReservationsRepository } from '#/features/reservations/LocalStorageReservationsRepository'
import type { ReservationsRepository } from '#/features/reservations/ReservationsRepository'
import { LocalStorageSavedRepository } from '#/features/saved/LocalStorageSavedRepository'
import type { SavedRepository } from '#/features/saved/SavedRepository'
import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
export interface AppContainer {
  /** The clock: everything time-dependent reads it, so tests are deterministic. */
  now: () => Date
  settingsRepository: SettingsRepository
  catalogRepository: CatalogRepository
  authRepository: AuthRepository
  reservationsRepository: ReservationsRepository
  savedRepository: SavedRepository
  preferencesRepository: PreferencesRepository
  exploreRepository: ExploreRepository
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so the repositories fall back to defaults.
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  const now = () => new Date()
  const auth = new LocalStorageAuthRepository(storage, now)
  const member = () => auth.sessionEmail()
  return {
    now,
    settingsRepository: new LocalStorageSettingsRepository(storage),
    catalogRepository: new BundledCatalogRepository(),
    authRepository: auth,
    reservationsRepository: new LocalStorageReservationsRepository(storage, member, { now }),
    savedRepository: new LocalStorageSavedRepository(storage, member),
    preferencesRepository: new LocalStoragePreferencesRepository(storage, member),
    exploreRepository: new LocalStorageExploreRepository(storage),
  }
}
