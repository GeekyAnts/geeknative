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
            settingsRepository: screenshotSettings() ?? UserDefaultsSettingsRepository(defaults: .standard),
            weddingRepository: UserDefaultsWeddingRepository(defaults: .standard)
        )
    }

    /// Screenshot capture passes `-screenshotAppearance light|dark`. Honor it even when a previous
    /// launch left a different appearance in UserDefaults, and don't write that choice back.
    private static func screenshotSettings() -> (any SettingsRepository)? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-screenshotAppearance"),
              index + 1 < arguments.count,
              let appearance = Appearance(rawValue: arguments[index + 1]) else { return nil }
        return InMemorySettingsRepository(appearance: appearance)
    }

    /// In-memory dependencies, for previews and tests.
    static func preview() -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            weddingRepository: InMemoryWeddingRepository()
        )
    }
}
