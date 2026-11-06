import SwiftUI

/// Screens that can be pushed onto a tab's navigation stack. Names match spec/navigation.md.
enum Route: Hashable {
    case settings
    case destinations
    case destination(String)
    case venues
    case venue(String)
    case experiences
    case packages
    case wedding
}

enum AppTab: Hashable {
    case home
    case destinations
    case venues
    case experiences
    case wedding
}

/// Selected tab and each tab's stack. Home, Destinations, Venues, Experiences and Wedding are tabs;
/// Packages, details and Settings are pushed.
@Observable
final class AppNavigation {
    var selectedTab: AppTab = .home
    var homePath: [Route] = []
    var destinationsPath: [Route] = []
    var venuesPath: [Route] = []
    var experiencesPath: [Route] = []
    var weddingPath: [Route] = []

    func open(_ tab: AppTab) {
        selectedTab = tab
    }

    func push(_ route: Route) {
        switch selectedTab {
        case .home: homePath.append(route)
        case .destinations: destinationsPath.append(route)
        case .venues: venuesPath.append(route)
        case .experiences: experiencesPath.append(route)
        case .wedding: weddingPath.append(route)
        }
    }
}

struct AppRouteView: View {
    let route: Route
    @Environment(AppContainer.self) private var container

    var body: some View {
        switch route {
        case .settings:
            SettingsScreen(viewModel: SettingsViewModel(repository: container.settingsRepository))
        case .destinations:
            DestinationsScreen()
        case .destination(let id):
            DestinationDetailScreen(destinationId: id)
        case .venues:
            VenuesScreen()
        case .venue(let id):
            VenueDetailScreen(venueId: id)
        case .experiences:
            ExperiencesScreen()
        case .packages:
            PackagesScreen()
        case .wedding:
            WeddingScreen()
        }
    }
}

extension View {
    func appRouteDestinations() -> some View {
        navigationDestination(for: Route.self) { route in
            AppRouteView(route: route)
        }
    }
}
