import Foundation
import Testing
@testable import App

@Suite("My trips")
struct MyTripsTests {
    private func trip(
        id: String = UUID().uuidString,
        status: TripStatus,
        start: String,
        end: String
    ) -> Trip {
        Trip(
            id: id,
            destinationId: "bali",
            title: "Bali",
            startDate: start,
            endDate: end,
            travelers: 2,
            budgetBand: .mid,
            interests: [],
            status: status,
            days: [TripDay(dayIndex: 1, date: start, items: [])]
        )
    }

    @Test("AC-my-trips-1: Trips are split into Upcoming, Past and Drafts using the status/date rules")
    func classification() {
        let today = TripDates.today()
        let draft = trip(status: .draft, start: "2020-01-01", end: "2020-01-03")
        let upcoming = trip(status: .upcoming, start: "2099-06-20", end: "2099-06-25")
        let staleUpcoming = trip(status: .upcoming, start: "2020-01-01", end: "2020-01-05")
        let past = trip(status: .past, start: "2020-01-01", end: "2020-01-05")
        #expect(TripClassification.segment(for: draft, today: today) == .drafts)
        #expect(TripClassification.segment(for: upcoming, today: today) == .upcoming)
        #expect(TripClassification.segment(for: staleUpcoming, today: today) == .past)
        #expect(TripClassification.segment(for: past, today: today) == .past)

        let repository = InMemoryTripRepository(trips: [draft, upcoming, staleUpcoming, past])
        let viewModel = MyTripsViewModel(
            catalogRepository: InMemoryCatalogRepository.bundled(),
            tripRepository: repository,
            navigation: AppNavigation()
        )
        viewModel.segment = .drafts
        #expect(viewModel.trips.map(\.id) == [draft.id])
        viewModel.segment = .upcoming
        #expect(viewModel.trips.map(\.id) == [upcoming.id])
        viewModel.segment = .past
        #expect(Set(viewModel.trips.map(\.id)) == Set([staleUpcoming.id, past.id]))
    }

    @Test("AC-my-trips-3: Deleting a trip after confirmation removes it from the list and from storage")
    func deleteConfirmed() {
        withFreshDefaults { defaults in
            let stored = trip(id: "keep-me", status: .draft, start: "2026-01-01", end: "2026-01-02")
            let repository = UserDefaultsTripRepository(defaults: defaults)
            repository.save(stored)
            let viewModel = MyTripsViewModel(
                catalogRepository: InMemoryCatalogRepository.bundled(),
                tripRepository: repository,
                navigation: AppNavigation()
            )
            viewModel.segment = .drafts
            viewModel.confirmDelete(stored)
            viewModel.deleteConfirmed()
            #expect(viewModel.trips.isEmpty)
            #expect(UserDefaultsTripRepository(defaults: defaults).trips.isEmpty)
        }
    }

    @Test("AC-my-trips-4: An empty segment shows that segment's empty state")
    func emptySegment() {
        let viewModel = MyTripsViewModel(
            catalogRepository: InMemoryCatalogRepository.bundled(),
            tripRepository: InMemoryTripRepository(),
            navigation: AppNavigation()
        )
        viewModel.segment = .upcoming
        #expect(viewModel.isEmpty)
        #expect(viewModel.emptyTitle == Strings.tripsEmptyUpcoming)
        #expect(viewModel.showsPlanAction)
        viewModel.segment = .past
        #expect(viewModel.emptyTitle == Strings.tripsEmptyPast)
        #expect(!viewModel.showsPlanAction)
        viewModel.segment = .drafts
        #expect(viewModel.emptyTitle == Strings.tripsEmptyDrafts)
        #expect(viewModel.showsPlanAction)
    }

    @Test("AC-my-trips-5: Trips are still listed after an app restart")
    func survivesRestart() {
        withFreshDefaults { defaults in
            let stored = trip(id: "round-trip", status: .upcoming, start: "2099-01-01", end: "2099-01-08")
            UserDefaultsTripRepository(defaults: defaults).save(stored)
            let relaunched = UserDefaultsTripRepository(defaults: defaults)
            #expect(relaunched.trips.contains { $0.id == "round-trip" })
        }
    }

    private func withFreshDefaults(_ body: (UserDefaults) -> Void) {
        let name = "MyTripsTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        body(defaults)
    }
}
