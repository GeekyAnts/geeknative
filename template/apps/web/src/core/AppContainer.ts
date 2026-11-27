import { LocalNotificationsRepository } from '#/features/notifications/LocalNotificationsRepository'
import type { NotificationsRepository } from '#/features/notifications/NotificationsRepository'
import { LocalStorageSettingsRepository } from '#/features/settings/LocalStorageSettingsRepository'
import type { SettingsRepository } from '#/features/settings/SettingsRepository'

/**
 * The app's dependencies, created once per router and shared through router context.
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 * Notifications start local. To use a server, pass the same local repository as the device
 * preference and a RemoteNotificationsRepository around your gateway.
 */
export interface AppContainer {
  settingsRepository: SettingsRepository
  notificationsRepository: NotificationsRepository
}

export function createAppContainer(): AppContainer {
  // During server rendering there's no localStorage, so the repository falls back to defaults.
  const storage = typeof window === 'undefined' ? undefined : window.localStorage
  return {
    settingsRepository: new LocalStorageSettingsRepository(storage),
    notificationsRepository: new LocalNotificationsRepository(storage),
  }
}
