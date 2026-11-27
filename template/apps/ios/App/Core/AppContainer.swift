import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let notificationsRepository: any NotificationsRepository

    init(settingsRepository: any SettingsRepository, notificationsRepository: any NotificationsRepository) {
        self.settingsRepository = settingsRepository
        self.notificationsRepository = notificationsRepository
    }

    static func live() -> AppContainer {
        let defaults = UserDefaults.standard
        let notifications = UserDefaultsNotificationsRepository(defaults: defaults)
        notifications.scheduler = SystemNotificationScheduler.shared
        return AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: defaults),
            notificationsRepository: notifications
        )
    }

    /// In-memory dependencies, for previews and tests.
    static func preview() -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            notificationsRepository: InMemoryNotificationsRepository()
        )
    }
}
