import Foundation
import Observation

/// State and actions for the Settings screen.
@Observable
final class SettingsViewModel {
    @ObservationIgnored private let repository: any SettingsRepository

    init(repository: any SettingsRepository) {
        self.repository = repository
    }

    var appearance: Appearance { repository.appearance }

    let appearanceOptions = Appearance.allCases

    var versionText: String {
        Strings.settingsAboutVersion(version: AppIdentity.version, build: AppIdentity.build)
    }

    /// The server this build talks to, for the environment it was built for.
    var serverAddress: String { AppConfig.apiBaseUrl.absoluteString }

    func selectAppearance(_ appearance: Appearance) {
        repository.setAppearance(appearance)
    }
}
