import Foundation
import Testing
import UIKit
@testable import App

@Suite("Settings")
struct SettingsTests {
    /// An empty UserDefaults suite, so tests don't share state.
    private func freshDefaults() -> UserDefaults {
        let name = "SettingsTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defaults.removePersistentDomain(forName: name)
        return defaults
    }

    @Test("AC-settings-1: appearance defaults to System")
    func defaultsToSystem() {
        #expect(UserDefaultsSettingsRepository(defaults: freshDefaults()).appearance == .system)

        let defaults = freshDefaults()
        defaults.set("sepia", forKey: Appearance.storageKey)
        #expect(UserDefaultsSettingsRepository(defaults: defaults).appearance == .system)
    }

    @Test("AC-settings-2: choosing an appearance applies it to the whole app immediately")
    func appliesImmediately() {
        let repository = InMemorySettingsRepository()
        let viewModel = SettingsViewModel(repository: repository)

        viewModel.selectAppearance(.dark)

        // RootView applies the repository's appearance to every window as it changes.
        #expect(repository.appearance == .dark)
        #expect(viewModel.appearance == .dark)
        #expect(Appearance.dark.interfaceStyle == .dark)
        #expect(Appearance.system.interfaceStyle == .unspecified)
    }

    @Test("AC-settings-3: the chosen appearance survives a restart")
    func survivesRestart() {
        let defaults = freshDefaults()
        UserDefaultsSettingsRepository(defaults: defaults).setAppearance(.light)

        #expect(UserDefaultsSettingsRepository(defaults: defaults).appearance == .light)
        #expect(defaults.string(forKey: "settings.appearance") == "light")
    }

    @Test("AC-settings-4: shows the app version and build number")
    func showsVersion() {
        let text = SettingsViewModel(repository: InMemorySettingsRepository()).versionText
        #expect(text.contains(AppIdentity.version))
        #expect(text.contains(String(AppIdentity.build)))
    }
}
