import SwiftUI
import UIKit

/// The navigation root. Also applies the chosen appearance to every window.
struct RootView: View {
    @Environment(AppContainer.self) private var container
    @State private var path: [Route] = LaunchOptions.current.initialPath

    var body: some View {
        NavigationStack(path: $path) {
            TasksScreen(viewModel: TasksViewModel(repository: container.tasksRepository, now: container.now))
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .taskDetail(let taskId):
                        TaskDetailScreen(
                            viewModel: TaskDetailViewModel(repository: container.tasksRepository, taskId: taskId, now: container.now),
                            presentsEditor: LaunchOptions.current.presentsEditor(for: taskId)
                        )
                    case .settings:
                        SettingsScreen(viewModel: SettingsViewModel(repository: container.settingsRepository))
                    }
                }
        }
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
    }

    /// Overrides the style on the windows themselves, so sheets and alerts follow too.
    private func apply(_ appearance: Appearance) {
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            for window in scene.windows {
                window.overrideUserInterfaceStyle = appearance.interfaceStyle
            }
        }
    }
}
