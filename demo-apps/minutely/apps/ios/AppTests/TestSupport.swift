import Foundation
@testable import App

/// An empty UserDefaults suite, so tests don't share state.
func freshDefaults(_ name: String = #function) -> UserDefaults {
    let suite = "AppTests.\(name).\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defaults.removePersistentDomain(forName: suite)
    return defaults
}
