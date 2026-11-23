import SwiftUI
import UIKit

/// The navigation root. Also applies the chosen appearance to every window.
struct RootView: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        @Bindable var router = container.router
        NavigationStack(path: $router.path) {
            HomeScreen(viewModel: HomeViewModel(container: container))
                .navigationDestination(for: Route.self) { route in
                    destination(for: route)
                }
        }
        .tint(AppColors.primary)
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
    }

    @ViewBuilder
    private func destination(for route: Route) -> some View {
        switch route {
        case .category(let categoryId):
            CategoryScreen(viewModel: CategoryViewModel(categoryId: categoryId, container: container))
        case .search:
            SearchScreen(viewModel: SearchViewModel(container: container))
        case .cart:
            CartScreen(viewModel: CartViewModel(container: container))
        case .orderPlaced(let orderId):
            OrderPlacedScreen(viewModel: OrderPlacedViewModel(orderId: orderId, container: container))
        case .settings:
            SettingsScreen(viewModel: SettingsViewModel(repository: container.settingsRepository))
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
