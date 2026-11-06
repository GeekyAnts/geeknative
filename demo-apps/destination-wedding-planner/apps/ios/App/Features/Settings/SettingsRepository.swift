import Foundation
import Observation

/// Stores the user's preferences. Screens use whichever implementation AppContainer provides.
protocol SettingsRepository: AnyObject {
    var appearance: Appearance { get }
    func setAppearance(_ appearance: Appearance)
}

/// Keeps settings in UserDefaults.
@Observable
final class UserDefaultsSettingsRepository: SettingsRepository {
    private(set) var appearance: Appearance
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        // A missing or unknown stored value counts as .system.
        appearance = defaults.string(forKey: Appearance.storageKey).flatMap(Appearance.init(rawValue:)) ?? .system
    }

    func setAppearance(_ appearance: Appearance) {
        self.appearance = appearance
        defaults.set(appearance.rawValue, forKey: Appearance.storageKey)
    }
}

/// Keeps settings in memory, for previews and tests.
@Observable
final class InMemorySettingsRepository: SettingsRepository {
    private(set) var appearance: Appearance

    init(appearance: Appearance = .system) {
        self.appearance = appearance
    }

    func setAppearance(_ appearance: Appearance) {
        self.appearance = appearance
    }
}
