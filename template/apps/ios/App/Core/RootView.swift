import SwiftUI
import UIKit

/// The navigation root. Also applies the chosen appearance to every window.
struct RootView: View {
    @Environment(AppContainer.self) private var container
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeScreen()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .settings:
                        SettingsScreen(viewModel: SettingsViewModel(
                            repository: container.settingsRepository,
                            notificationsRepository: container.notificationsRepository
                        ))
                    }
                }
        }
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
        .onReceive(NotificationCenter.default.publisher(for: .notificationOpened)) { note in
            // A tap already opened this app. Show the screen the row points at.
            path = (note.object as? String) == "settings" ? [.settings] : []
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
