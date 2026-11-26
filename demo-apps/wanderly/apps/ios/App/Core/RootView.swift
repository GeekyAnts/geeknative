import SwiftUI
import UIKit

/// Five-tab navigation root. Also applies the chosen appearance to every window.
struct RootView: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        @Bindable var navigation = container.navigation
        TabView(selection: $navigation.selectedTab) {
            tabStack(path: $navigation.homePath, tab: .home) {
                HomeScreen()
            }
            .tabItem {
                Image(AppIcon.home)
                Text(Strings.tabsHome)
            }
            .tag(AppTab.home)

            tabStack(path: $navigation.explorePath, tab: .explore) {
                ExploreScreen()
            }
            .tabItem {
                Image(AppIcon.explore)
                Text(Strings.tabsExplore)
            }
            .tag(AppTab.explore)

            tabStack(path: $navigation.tripsPath, tab: .trips) {
                MyTripsScreen()
            }
            .tabItem {
                Image(AppIcon.trips)
                Text(Strings.tabsTrips)
            }
            .tag(AppTab.trips)

            tabStack(path: $navigation.savedPath, tab: .saved) {
                SavedScreen()
            }
            .tabItem {
                Image(AppIcon.saved)
                Text(Strings.tabsSaved)
            }
            .tag(AppTab.saved)

            tabStack(path: $navigation.profilePath, tab: .profile) {
                ProfileScreen()
            }
            .tabItem {
                Image(AppIcon.profile)
                Text(Strings.tabsProfile)
            }
            .tag(AppTab.profile)
        }
        .tint(AppColors.primary)
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
    }

    private func tabStack<Content: View>(
        path: Binding<[Route]>,
        tab _: AppTab,
        @ViewBuilder content: () -> Content
    ) -> some View {
        NavigationStack(path: path) {
            content()
                .navigationDestination(for: Route.self) { route in
                    routedView(route)
                        .toolbar(.hidden, for: .tabBar)
                }
        }
    }

    @ViewBuilder
    private func routedView(_ route: Route) -> some View {
        switch route {
        case .city(let destinationId):
            CityDetailsScreen(destinationId: destinationId)
        case .place(let placeId):
            PlaceDetailsScreen(placeId: placeId)
        case .explore(let q, let category):
            ExploreScreen(initialQuery: q, initialCategory: category, isolated: true)
        case .planner(let destinationId):
            TripPlannerScreen(destinationId: destinationId)
        case .itinerary(let tripId):
            ItineraryScreen(tripId: tripId)
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
