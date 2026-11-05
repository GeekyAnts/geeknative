import Foundation
import Observation

/// Screens pushed onto the signed-in stack, above the tabs. Names match spec/navigation.md.
enum Route: Hashable {
    case restaurant(String)
    /// `reservationId` modifies that reservation; `rebookFromId` books again with its party size and seating.
    case reserve(restaurantId: String, reservationId: String? = nil, rebookFromId: String? = nil)
    case confirmation(String)
    case reservation(String)
    case notifications
    case preferences
    case help
    case settings
}

/// Screens of the signed-out stack, above Welcome.
enum AuthRoute: Hashable {
    case signIn
    case signUp
}

/// A request to open Explore with one filter applied, replacing whatever filters it had.
struct ExploreRequest: Equatable {
    let id = UUID()
    var query: String?
    var cuisine: CuisineId?
    var collection: CollectionId?
    var focusSearch = false
}

/// Which Reservations segment to show.
enum ReservationsSegment: String, CaseIterable, Identifiable {
    case upcoming, past, cancelled

    var id: Self { self }

    var label: String {
        switch self {
        case .upcoming: Strings.reservationsTabUpcoming
        case .past: Strings.reservationsTabPast
        case .cancelled: Strings.reservationsTabCancelled
        }
    }
}

struct ReservationsSegmentRequest: Equatable {
    let id = UUID()
    var segment: ReservationsSegment
}

/// Navigation state of the signed-in stack: the pushed routes and the selected tab.
@Observable
final class AppRouter {
    var path: [Route] = []
    var selectedTab: AppTab = .discover
    var exploreRequest: ExploreRequest?
    var reservationsRequest: ReservationsSegmentRequest?

    func push(_ route: Route) {
        path.append(route)
    }

    func pop() {
        if !path.isEmpty { path.removeLast() }
    }

    /// Replaces the top screen, so Back skips it (Reserve → Confirmation).
    func replaceTop(with route: Route) {
        if !path.isEmpty { path.removeLast() }
        path.append(route)
    }

    func switchTab(_ tab: AppTab) {
        path.removeAll()
        selectedTab = tab
    }

    func openExplore(_ request: ExploreRequest) {
        exploreRequest = request
        switchTab(.explore)
    }

    func openReservations(_ segment: ReservationsSegment) {
        reservationsRequest = ReservationsSegmentRequest(segment: segment)
        switchTab(.reservations)
    }
}
