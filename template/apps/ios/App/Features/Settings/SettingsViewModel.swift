import Observation

/// State and actions for the Settings screen.
@Observable
final class SettingsViewModel {
    @ObservationIgnored private let repository: any SettingsRepository
    @ObservationIgnored private let notificationsRepository: any NotificationsRepository

    init(repository: any SettingsRepository, notificationsRepository: any NotificationsRepository) {
        self.repository = repository
        self.notificationsRepository = notificationsRepository
        notificationsEnabled = notificationsRepository.enabled
    }

    var appearance: Appearance { repository.appearance }

    let appearanceOptions = Appearance.allCases

    /// The device preference. Off until the user turns it on.
    var notificationsEnabled: Bool

    var versionText: String {
        Strings.settingsAboutVersion(version: AppIdentity.version, build: AppIdentity.build)
    }

    func selectAppearance(_ appearance: Appearance) {
        repository.setAppearance(appearance)
    }

    func setNotificationsEnabled(_ enabled: Bool) {
        notificationsEnabled = enabled
        notificationsRepository.setEnabled(enabled)
    }
}
