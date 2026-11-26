import Foundation
import Observation

@Observable
final class PlaceDetailsViewModel {
    let placeId: String
    private(set) var isSaved: Bool
    var showTripSheet = false
    var showAddedBanner = false

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let savedRepository: any SavedRepository
    @ObservationIgnored private let tripRepository: any TripRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        placeId: String,
        catalogRepository: any CatalogRepository,
        savedRepository: any SavedRepository,
        tripRepository: any TripRepository,
        navigation: AppNavigation
    ) {
        self.placeId = placeId
        self.catalogRepository = catalogRepository
        self.savedRepository = savedRepository
        self.tripRepository = tripRepository
        self.navigation = navigation
        self.isSaved = savedRepository.isSaved(id: placeId)
    }

    convenience init(placeId: String, container: AppContainer) {
        self.init(
            placeId: placeId,
            catalogRepository: container.catalogRepository,
            savedRepository: container.savedRepository,
            tripRepository: container.tripRepository,
            navigation: container.navigation
        )
    }

    var place: Place? { catalogRepository.catalog.place(id: placeId) }
    var isUnknown: Bool { place == nil }
    var fallbackImageURL: String { catalogRepository.catalog.fallbackImageUrl }

    var destination: Destination? {
        guard let place else { return nil }
        return catalogRepository.catalog.destination(id: place.destinationId)
    }

    var matchingTrips: [Trip] {
        guard let place else { return [] }
        let today = TripDates.today()
        return tripRepository.trips.filter { trip in
            trip.destinationId == place.destinationId
                && (trip.status == .draft || TripClassification.segment(for: trip, today: today) == .upcoming)
        }
    }

    func toggleSave() {
        guard let place else { return }
        savedRepository.toggle(id: place.id, kind: SavedKind(placeKind: place.kind))
        isSaved = savedRepository.isSaved(id: place.id)
    }

    func addToTripTapped() {
        showTripSheet = true
    }

    func add(to trip: Trip) {
        guard let place else { return }
        var updated = trip
        if updated.days.isEmpty {
            updated.days = [TripDay(dayIndex: 1, date: updated.startDate, items: [])]
        }
        let duration = place.durationMinutes
        let item = TripItem(
            id: UUID().uuidString,
            placeId: place.id,
            startTime: "09:00",
            durationMinutes: duration,
            completed: false
        )
        updated.days[0].items.append(item)
        tripRepository.save(updated)
        showTripSheet = false
        showAddedBanner = true
    }

    func startTrip() {
        showTripSheet = false
        guard let place else { return }
        navigation.openPlanner(destinationId: place.destinationId)
    }

    func ratingText(for place: Place) -> String {
        Strings.placeRating(rating: AppFormat.rating(place.rating), count: AppFormat.int(place.reviewCount))
    }

    func durationText(for place: Place) -> String {
        Strings.placeDuration(minutes: AppFormat.int(place.durationMinutes))
    }

    func priceText(for place: Place) -> String? {
        guard place.kind == .hotel, let price = place.pricePerNight, let destination else { return nil }
        return Strings.placePricePerNight(symbol: destination.currencySymbol, amount: AppFormat.int(price))
    }
}
