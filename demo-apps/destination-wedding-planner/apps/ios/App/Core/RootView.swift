import SwiftUI
import UIKit

/// The navigation root: five tabs, each with its own stack. Also applies the chosen appearance.
struct RootView: View {
    @Environment(AppContainer.self) private var container
    @State private var navigation = AppNavigation()

    var body: some View {
        @Bindable var navigation = navigation
        TabView(selection: $navigation.selectedTab) {
            tab(path: $navigation.homePath, tab: .home, title: Strings.navHome, icon: AppIcon.home) {
                HomeScreen()
            }
            tab(path: $navigation.destinationsPath, tab: .destinations, title: Strings.navDestinations, icon: AppIcon.compass) {
                DestinationsScreen()
            }
            tab(path: $navigation.venuesPath, tab: .venues, title: Strings.navVenues, icon: AppIcon.landmark) {
                VenuesScreen()
            }
            tab(path: $navigation.experiencesPath, tab: .experiences, title: Strings.navExperiences, icon: AppIcon.sparkles) {
                ExperiencesScreen()
            }
            tab(path: $navigation.weddingPath, tab: .wedding, title: Strings.navWedding, icon: AppIcon.heart) {
                WeddingScreen()
            }
        }
        .tint(AppColors.primary)
        .environment(navigation)
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
    }

    @ViewBuilder
    private func tab<Content: View>(
        path: Binding<[Route]>,
        tab: AppTab,
        title: String,
        icon: ImageResource,
        @ViewBuilder content: () -> Content
    ) -> some View {
        NavigationStack(path: path) {
            content()
                .appRouteDestinations()
        }
        .tabItem {
            Label {
                Text(title)
            } icon: {
                Image(icon)
            }
        }
        .tag(tab)
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
