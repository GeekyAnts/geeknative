import Foundation
import Testing
import UIKit
@testable import App

@Suite("Settings")
struct SettingsTests {
    /// Runs `body` with an empty UserDefaults suite, so tests don't share state, and removes the
    /// suite afterwards so test runs don't leave preference files behind.
    private func withFreshDefaults(_ body: (UserDefaults) -> Void) {
        let name = "SettingsTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        body(defaults)
    }

    @Test("AC-settings-1: appearance defaults to System")
    func defaultsToSystem() {
        withFreshDefaults { defaults in
            #expect(UserDefaultsSettingsRepository(defaults: defaults).appearance == .system)
        }
        withFreshDefaults { defaults in
            defaults.set("sepia", forKey: Appearance.storageKey)
            #expect(UserDefaultsSettingsRepository(defaults: defaults).appearance == .system)
        }
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
        withFreshDefaults { defaults in
            UserDefaultsSettingsRepository(defaults: defaults).setAppearance(.light)

            #expect(UserDefaultsSettingsRepository(defaults: defaults).appearance == .light)
            #expect(defaults.string(forKey: "settings.appearance") == "light")
        }
    }

    @Test("AC-settings-4: shows the app version and build number")
    func showsVersion() {
        let text = SettingsViewModel(repository: InMemorySettingsRepository()).versionText
        #expect(text.contains(AppIdentity.version))
        #expect(text.contains(String(AppIdentity.build)))
    }

    @Test("AC-settings-5: shows the server address from AppConfig.apiBaseUrl")
    func showsServer() {
        let viewModel = SettingsViewModel(repository: InMemorySettingsRepository())
        #expect(viewModel.serverAddress == AppConfig.apiBaseUrl.absoluteString)
        #expect(viewModel.serverAddress == "http://127.0.0.1:8080")
        #expect(Strings.settingsAboutServer != "settings.about.server")
    }
}

@Suite("Launch options")
struct LaunchOptionsTests {
    @Test("-uiTesting uses the in-memory repository with the sample tasks")
    func uiTesting() async throws {
        let container = AppContainer.forLaunch(LaunchOptions(arguments: ["-uiTesting"]))
        let repository = try #require(container.tasksRepository as? InMemoryTasksRepository)
        #expect(repository.tasks.map(\.id) == ["sample-1", "sample-2", "sample-3", "sample-4"])
        #expect(container.settingsRepository is InMemorySettingsRepository)
    }

    @Test("Screenshot launch keeps the live repository, forces the appearance and opens the screen")
    func screenshot() {
        let detail = LaunchOptions(arguments: ["-screenshotScreen", "task-detail", "-screenshotTaskId", "t1", "-screenshotAppearance", "dark"])
        let container = AppContainer.forLaunch(detail)
        #expect(container.tasksRepository is ApiTasksRepository)
        #expect(container.settingsRepository is InMemorySettingsRepository)
        #expect(container.settingsRepository.appearance == .dark)
        #expect(detail.initialPath == [.taskDetail("t1")])
        #expect(!detail.presentsEditor(for: "t1"))

        let editor = LaunchOptions(arguments: ["-screenshotScreen", "task-editor", "-screenshotTaskId", "t1"])
        #expect(editor.initialPath == [.taskDetail("t1")])
        #expect(editor.presentsEditor(for: "t1"))

        #expect(LaunchOptions(arguments: ["-screenshotScreen", "tasks"]).initialPath.isEmpty)
        #expect(LaunchOptions(arguments: []).initialPath.isEmpty)
        #expect(AppContainer.forLaunch(LaunchOptions(arguments: [])).tasksRepository is ApiTasksRepository)
    }
}
