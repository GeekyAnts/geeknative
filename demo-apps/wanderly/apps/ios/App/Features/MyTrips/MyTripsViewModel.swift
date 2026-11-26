import Foundation
import Observation

@Observable
final class MyTripsViewModel {
    var segment: TripSegment = .upcoming
    var pendingDelete: Trip?
    private(set) var stamp = 0

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let tripRepository: any TripRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        catalogRepository: any CatalogRepository,
        tripRepository: any TripRepository,
        navigation: AppNavigation
    ) {
        self.catalogRepository = catalogRepository
        self.tripRepository = tripRepository
        self.navigation = navigation
    }

    convenience init(container: AppContainer) {
        self.init(
            catalogRepository: container.catalogRepository,
            tripRepository: container.tripRepository,
            navigation: container.navigation
        )
    }

    var fallbackImageURL: String { catalogRepository.catalog.fallbackImageUrl }

    func refresh() {
        stamp += 1
    }

    var trips: [Trip] {
        _ = stamp
        let today = TripDates.today()
        return tripRepository.trips.filter { TripClassification.segment(for: $0, today: today) == segment }
    }

    var isEmpty: Bool { trips.isEmpty }

    var emptyTitle: String {
        switch segment {
        case .upcoming: Strings.tripsEmptyUpcoming
        case .past: Strings.tripsEmptyPast
        case .drafts: Strings.tripsEmptyDrafts
        }
    }

    var emptyBody: String {
        switch segment {
        case .upcoming: Strings.tripsEmptyUpcomingBody
        case .past: Strings.tripsEmptyPastBody
        case .drafts: Strings.tripsEmptyDraftsBody
        }
    }

    var showsPlanAction: Bool {
        segment == .upcoming || segment == .drafts
    }

    func destination(for trip: Trip) -> Destination? {
        catalogRepository.catalog.destination(id: trip.destinationId)
    }

    func datesText(for trip: Trip) -> String {
        Strings.itineraryDates(start: AppFormat.mediumDate(trip.startDate), end: AppFormat.mediumDate(trip.endDate))
    }

    func open(_ trip: Trip) {
        navigation.openItinerary(tripId: trip.id)
    }

    func plan() {
        navigation.openPlanner(destinationId: nil)
    }

    func confirmDelete(_ trip: Trip) {
        pendingDelete = trip
    }

    func deleteConfirmed() {
        guard let pendingDelete else { return }
        tripRepository.delete(id: pendingDelete.id)
        self.pendingDelete = nil
        refresh()
    }

    func cancelDelete() {
        pendingDelete = nil
    }
}
