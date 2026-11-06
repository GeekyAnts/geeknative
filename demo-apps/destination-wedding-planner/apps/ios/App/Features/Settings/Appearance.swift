import UIKit

/// The appearance setting. Stored as these exact raw values on every platform.
nonisolated enum Appearance: String, CaseIterable, Identifiable {
    case system, light, dark

    /// Storage key, shared with the Android and web apps.
    static let storageKey = "settings.appearance"

    var id: Self { self }

    var label: String {
        switch self {
        case .system: Strings.settingsAppearanceSystem
        case .light: Strings.settingsAppearanceLight
        case .dark: Strings.settingsAppearanceDark
        }
    }

    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }
}
