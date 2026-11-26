import Foundation
import Observation

/// Per-tab stacks plus Explore filters that Home can set when switching tabs.
@Observable
final class AppNavigation {
    var selectedTab: AppTab = .home
    var homePath: [Route] = []
    var explorePath: [Route] = []
    var tripsPath: [Route] = []
    var savedPath: [Route] = []
    var profilePath: [Route] = []
    var exploreQuery: String = ""
    var exploreCategory: String?

    func openExplore(q: String?, category: String?) {
        exploreQuery = q ?? ""
        exploreCategory = category
        explorePath = []
        selectedTab = .explore
    }

    func push(_ route: Route) {
        switch selectedTab {
        case .home: homePath.append(route)
        case .explore: explorePath.append(route)
        case .trips: tripsPath.append(route)
        case .saved: savedPath.append(route)
        case .profile: profilePath.append(route)
        }
    }

    func openPlanner(destinationId: String?) {
        push(.planner(destinationId: destinationId))
    }

    func openCity(destinationId: String) {
        push(.city(destinationId: destinationId))
    }

    func openPlace(placeId: String) {
        push(.place(placeId: placeId))
    }

    func openItinerary(tripId: String) {
        push(.itinerary(tripId: tripId))
    }

    func openSettings() {
        push(.settings)
    }
}
