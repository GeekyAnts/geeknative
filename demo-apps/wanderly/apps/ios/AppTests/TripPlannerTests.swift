import Foundation
import Testing
@testable import App

@Suite("Trip planner")
struct TripPlannerTests {
    private func catalog() -> Catalog {
        InMemoryCatalogRepository.bundled().catalog
    }

    private func planner(
        destinationId: String?,
        trips: InMemoryTripRepository = InMemoryTripRepository(),
        profile: InMemoryProfileRepository = InMemoryProfileRepository(),
        navigation: AppNavigation = AppNavigation()
    ) -> (TripPlannerViewModel, InMemoryTripRepository, AppNavigation) {
        let catalog = InMemoryCatalogRepository.bundled()
        let viewModel = TripPlannerViewModel(
            destinationId: destinationId,
            catalogRepository: catalog,
            tripRepository: trips,
            profileRepository: profile,
            navigation: navigation
        )
        return (viewModel, trips, navigation)
    }

    @Test("AC-trip-planner-1: Generate requires a destination, start date and end date")
    func requiresFields() {
        let (viewModel, trips, _) = planner(destinationId: nil)
        viewModel.generate()
        #expect(viewModel.destinationErrorVisible)
        #expect(trips.trips.isEmpty)

        viewModel.destinationId = "bali"
        viewModel.generate()
        #expect(viewModel.validationError == nil)
        #expect(!trips.trips.isEmpty)
        #expect(trips.trips.first?.startDate == TripDates.string(from: viewModel.startDate))
        #expect(trips.trips.first?.endDate == TripDates.string(from: viewModel.endDate))
    }

    @Test("AC-trip-planner-2: An end date before the start date shows planner.dateError and does not create a trip")
    func endBeforeStart() {
        let (viewModel, trips, _) = planner(destinationId: "bali")
        viewModel.startDate = TripDates.date(from: "2026-06-10")!
        viewModel.endDate = TripDates.date(from: "2026-06-01")!
        viewModel.generate()
        #expect(viewModel.dateErrorVisible)
        #expect(viewModel.validationError == .date)
        #expect(Strings.plannerDateError.isEmpty == false)
        #expect(trips.trips.isEmpty)
    }

    @Test("AC-trip-planner-3: Generate creates one itinerary day per stay day (capped at 7), using the destination's templates")
    func generatesDays() throws {
        let catalog = catalog()
        let bali = try #require(catalog.destination(id: "bali"))
        let trips = InMemoryTripRepository()
        let short = try trips.generate(
            destination: bali,
            startDate: "2026-01-01",
            endDate: "2026-01-03",
            travelers: 2,
            budgetBand: .mid,
            interests: [],
            catalog: catalog
        )
        #expect(short.days.count == 3)
        #expect(short.days.map(\.dayIndex) == [1, 2, 3])
        #expect(short.days[0].date == "2026-01-01")
        #expect(short.days[2].date == "2026-01-03")
        #expect(short.status == .draft)
        #expect(short.days.allSatisfy { !$0.items.isEmpty })
        #expect(short.days[0].items.count == bali.itineraryTemplates[0].items.count)

        let long = try trips.generate(
            destination: bali,
            startDate: "2026-02-01",
            endDate: "2026-02-12",
            travelers: 2,
            budgetBand: .mid,
            interests: [],
            catalog: catalog
        )
        #expect(TripDates.daysInclusive(from: "2026-02-01", to: "2026-02-12") == 12)
        #expect(long.days.count == 7)
        #expect(long.startDate == "2026-02-01")
        #expect(long.endDate == "2026-02-12")
        #expect(long.days[3].items.map(\.placeId) == bali.itineraryTemplates[3 % bali.itineraryTemplates.count].items.map(\.placeId))
    }

    @Test("AC-trip-planner-5: Each itinerary item shows a photograph, name, start time and duration")
    func itemPresentation() throws {
        let catalog = catalog()
        let bali = try #require(catalog.destination(id: "bali"))
        let trip = try InMemoryTripRepository().generate(
            destination: bali,
            startDate: "2026-01-01",
            endDate: "2026-01-02",
            travelers: 2,
            budgetBand: .mid,
            interests: [],
            catalog: catalog
        )
        let item = try #require(trip.days.first?.items.first)
        let place = try #require(catalog.place(id: item.placeId))
        #expect(!place.imageUrl.isEmpty)
        #expect(!place.name.isEmpty)
        #expect(!item.startTime.isEmpty)
        #expect(item.durationMinutes > 0)
        let viewModel = ItineraryViewModel(
            tripId: trip.id,
            catalogRepository: InMemoryCatalogRepository(catalog: catalog),
            tripRepository: InMemoryTripRepository(trips: [trip]),
            navigation: AppNavigation()
        )
        #expect(viewModel.timeDuration(for: item).contains(item.startTime))
        #expect(viewModel.place(for: item)?.name == place.name)
    }

    @Test("AC-trip-planner-6: The traveler can add, remove, reorder (move up/down) and complete items; the change is still there after a restart")
    func editsPersist() throws {
        try withFreshDefaults { defaults in
            let catalog = try Catalog.loadFromBundle()
            let bali = try #require(catalog.destination(id: "bali"))
            let repository = UserDefaultsTripRepository(defaults: defaults)
            let trip = try repository.generate(
                destination: bali,
                startDate: "2026-01-01",
                endDate: "2026-01-01",
                travelers: 2,
                budgetBand: .mid,
                interests: [],
                catalog: catalog
            )
            let viewModel = ItineraryViewModel(
                tripId: trip.id,
                catalogRepository: InMemoryCatalogRepository(catalog: catalog),
                tripRepository: repository,
                navigation: AppNavigation()
            )
            let day = try #require(viewModel.trip?.days.first)
            let first = try #require(day.items.first)
            let second = try #require(day.items.dropFirst().first)
            viewModel.moveDown(first, on: day)
            let afterMove = try #require(viewModel.trip?.days.first)
            #expect(afterMove.items.first?.id == second.id)
            viewModel.toggleComplete(afterMove.items[0], on: afterMove)
            #expect(viewModel.trip?.days.first?.items.first?.completed == true)
            viewModel.remove(afterMove.items[0], on: afterMove)
            #expect(viewModel.trip?.days.first?.items.contains { $0.id == second.id } == false)

            let extra = try #require(catalog.places(destinationId: "bali").first { place in
                viewModel.trip?.days.first?.items.contains { $0.placeId == place.id } == false
            })
            let dayForAdd = try #require(viewModel.trip?.days.first)
            viewModel.add(extra, to: dayForAdd)
            #expect(viewModel.trip?.days.first?.items.contains { $0.placeId == extra.id } == true)

            let relaunched = UserDefaultsTripRepository(defaults: defaults)
            let restored = try #require(relaunched.trip(id: trip.id))
            #expect(restored.days.first?.items.contains { $0.placeId == extra.id } == true)
            #expect(restored.days.first?.items.contains { $0.id == second.id } == false)
        }
    }

    @Test("AC-trip-planner-7: The budget breakdown equals the lodging / food / activities formula for the chosen band, day count and travelers")
    func budgetFormula() throws {
        let catalog = catalog()
        let bali = try #require(catalog.destination(id: "bali"))
        let trip = try InMemoryTripRepository().generate(
            destination: bali,
            startDate: "2026-01-01",
            endDate: "2026-01-05",
            travelers: 3,
            budgetBand: .luxury,
            interests: ["food"],
            catalog: catalog
        )
        #expect(trip.days.count == 5)
        let estimates = bali.budgetEstimates.luxury
        let expectedLodging = estimates.lodging * 5
        let expectedFood = estimates.food * 5 * 3
        let expectedActivities = estimates.activities * 5 * 3
        let breakdown = BudgetBreakdown.compute(destination: bali, band: .luxury, days: trip.days.count, travelers: 3)
        #expect(breakdown.lodging == expectedLodging)
        #expect(breakdown.food == expectedFood)
        #expect(breakdown.activities == expectedActivities)
        #expect(breakdown.total == expectedLodging + expectedFood + expectedActivities)

        let viewModel = ItineraryViewModel(
            tripId: trip.id,
            catalogRepository: InMemoryCatalogRepository(catalog: catalog),
            tripRepository: InMemoryTripRepository(trips: [trip]),
            navigation: AppNavigation()
        )
        #expect(viewModel.budget == breakdown)
    }

    @Test("interests stable-sort matching categories first without dropping items")
    func interestSort() throws {
        let catalog = catalog()
        let paris = try #require(catalog.destination(id: "paris"))
        let unsorted = try TripGeneration.generate(
            destination: paris,
            startDate: "2026-03-01",
            endDate: "2026-03-01",
            travelers: 2,
            budgetBand: .mid,
            interests: [],
            catalog: catalog
        )
        let sorted = try TripGeneration.generate(
            destination: paris,
            startDate: "2026-03-01",
            endDate: "2026-03-01",
            travelers: 2,
            budgetBand: .mid,
            interests: ["food"],
            catalog: catalog
        )
        #expect(unsorted.days[0].items.count == sorted.days[0].items.count)
        let firstPlace = try #require(catalog.place(id: sorted.days[0].items[0].placeId))
        #expect(firstPlace.category == "food" || sorted.days[0].items.allSatisfy { catalog.place(id: $0.placeId)?.category != "food" })
    }

    private func withFreshDefaults(_ body: (UserDefaults) throws -> Void) rethrows {
        let name = "TripPlannerTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        try body(defaults)
    }
}
