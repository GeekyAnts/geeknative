import Foundation
import Observation

@Observable
final class ItineraryViewModel {
    let tripId: String
    var addingToDay: Int?
    private(set) var trip: Trip?

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let tripRepository: any TripRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        tripId: String,
        catalogRepository: any CatalogRepository,
        tripRepository: any TripRepository,
        navigation: AppNavigation
    ) {
        self.tripId = tripId
        self.catalogRepository = catalogRepository
        self.tripRepository = tripRepository
        self.navigation = navigation
        self.trip = tripRepository.trip(id: tripId)
    }

    convenience init(tripId: String, container: AppContainer) {
        self.init(
            tripId: tripId,
            catalogRepository: container.catalogRepository,
            tripRepository: container.tripRepository,
            navigation: container.navigation
        )
    }

    var catalog: Catalog { catalogRepository.catalog }
    var fallbackImageURL: String { catalog.fallbackImageUrl }

    var destination: Destination? {
        guard let trip else { return nil }
        return catalog.destination(id: trip.destinationId)
    }

    var budget: BudgetBreakdown? {
        guard let trip, let destination else { return nil }
        return BudgetBreakdown.compute(
            destination: destination,
            band: trip.budgetBand,
            days: trip.days.count,
            travelers: trip.travelers
        )
    }

    func place(for item: TripItem) -> Place? {
        catalog.place(id: item.placeId)
    }

    func addablePlaces(for day: TripDay) -> [Place] {
        guard let trip else { return [] }
        let used = Set(day.items.map(\.placeId))
        return catalog.places(destinationId: trip.destinationId).filter { !used.contains($0.id) }
    }

    func toggleComplete(_ item: TripItem, on day: TripDay) {
        mutateDay(day.dayIndex) { current in
            guard let index = current.items.firstIndex(where: { $0.id == item.id }) else { return }
            current.items[index].completed.toggle()
        }
    }

    func remove(_ item: TripItem, on day: TripDay) {
        mutateDay(day.dayIndex) { current in
            current.items.removeAll { $0.id == item.id }
        }
    }

    func moveUp(_ item: TripItem, on day: TripDay) {
        mutateDay(day.dayIndex) { current in
            guard let index = current.items.firstIndex(where: { $0.id == item.id }), index > 0 else { return }
            current.items.swapAt(index, index - 1)
        }
    }

    func moveDown(_ item: TripItem, on day: TripDay) {
        mutateDay(day.dayIndex) { current in
            guard let index = current.items.firstIndex(where: { $0.id == item.id }), index < current.items.count - 1 else { return }
            current.items.swapAt(index, index + 1)
        }
    }

    func add(_ place: Place, to day: TripDay) {
        mutateDay(day.dayIndex) { current in
            current.items.append(
                TripItem(
                    id: UUID().uuidString,
                    placeId: place.id,
                    startTime: TripGeneration.startTimeForNewItem(on: current),
                    durationMinutes: place.durationMinutes,
                    completed: false
                )
            )
        }
        addingToDay = nil
    }

    func saveTrip() {
        guard var trip else { return }
        let today = TripDates.today()
        trip.status = trip.endDate >= today ? .upcoming : .past
        persist(trip)
    }

    func openPlace(_ place: Place) {
        navigation.openPlace(placeId: place.id)
    }

    func datesText(for trip: Trip) -> String {
        Strings.itineraryDates(start: AppFormat.mediumDate(trip.startDate), end: AppFormat.mediumDate(trip.endDate))
    }

    func timeDuration(for item: TripItem) -> String {
        Strings.itineraryTimeDuration(time: item.startTime, minutes: AppFormat.int(item.durationMinutes))
    }

    func amount(_ value: Int, symbol: String) -> String {
        Strings.itineraryBudgetAmount(symbol: symbol, amount: AppFormat.int(value))
    }

    private func mutateDay(_ dayIndex: Int, _ body: (inout TripDay) -> Void) {
        guard var trip else { return }
        guard let index = trip.days.firstIndex(where: { $0.dayIndex == dayIndex }) else { return }
        body(&trip.days[index])
        persist(trip)
    }

    private func persist(_ trip: Trip) {
        tripRepository.save(trip)
        self.trip = tripRepository.trip(id: trip.id)
    }
}
