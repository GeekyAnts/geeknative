import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let weddingRepository: any WeddingRepository

    init(settingsRepository: any SettingsRepository, weddingRepository: any WeddingRepository) {
        self.settingsRepository = settingsRepository
        self.weddingRepository = weddingRepository
    }

    static func live() -> AppContainer {
        AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: .standard),
            weddingRepository: UserDefaultsWeddingRepository(defaults: .standard)
        )
    }

    /// In-memory dependencies, for previews and tests.
    static func preview() -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            weddingRepository: InMemoryWeddingRepository()
        )
    }
}
