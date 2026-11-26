import type { CartRepository } from '#/features/cart/CartRepository'
import { LocalStorageCartRepository } from '#/features/cart/LocalStorageCartRepository'
import type { CatalogRepository } from '#/features/catalog/CatalogRepository'
import { LocalCatalogRepository } from '#/features/catalog/LocalCatalogRepository'
import { LocalStorageOrdersRepository } from '#/features/order/LocalStorageOrdersRepository'
import type { OrdersRepository } from '#/features/order/OrdersRepository'
import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
export interface AppContainer {
  settingsRepository: SettingsRepository
  catalogRepository: CatalogRepository
  cartRepository: CartRepository
  ordersRepository: OrdersRepository
  /** The current time in milliseconds since 1970. Tests pass a fixed clock. */
  clock: () => number
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so the repositories fall back to defaults (an empty cart, no orders).
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  const catalogRepository = new LocalCatalogRepository()
  return {
    settingsRepository: new LocalStorageSettingsRepository(storage),
    catalogRepository,
    cartRepository: new LocalStorageCartRepository(storage, catalogRepository),
    ordersRepository: new LocalStorageOrdersRepository(storage),
    clock: () => Date.now(),
  }
}
