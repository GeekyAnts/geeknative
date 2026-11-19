import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let tasksRepository: any TasksRepository
    /// The clock, so "today" (overdue, a new due date) can be fixed in tests.
    @ObservationIgnored let now: () -> Date

    init(settingsRepository: any SettingsRepository, tasksRepository: any TasksRepository, now: @escaping () -> Date = Date.init) {
        self.settingsRepository = settingsRepository
        self.tasksRepository = tasksRepository
        self.now = now
    }

    static func live() -> AppContainer {
        AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: .standard),
            tasksRepository: ApiTasksRepository()
        )
    }

    /// In-memory dependencies with the sample tasks, for previews and tests.
    static func preview(appearance: Appearance = .system, now: @escaping () -> Date = Date.init) -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(appearance: appearance),
            tasksRepository: InMemoryTasksRepository(tasks: TaskSamples.make(today: now()), now: now),
            now: now
        )
    }
}
