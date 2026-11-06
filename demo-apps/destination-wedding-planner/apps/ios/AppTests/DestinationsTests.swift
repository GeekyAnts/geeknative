import Foundation
import Testing
@testable import App

@Suite("Destinations")
struct DestinationsTests {
    @Test("AC-destinations-1: Destinations shows every catalog destination when no filter is applied")
    func showsEveryDestination() {
        let results = CatalogFilters.destinations(DestinationFilters())
        #expect(results.count == WeddingCatalog.destinations.count)
        #expect(results.map(\.id) == WeddingCatalog.destinations.map(\.id))
    }

    @Test("AC-destinations-2: Choosing a style hides destinations that do not include that style")
    func filtersByStyle() {
        let results = CatalogFilters.destinations(DestinationFilters(style: .beach))
        #expect(!results.isEmpty)
        #expect(results.allSatisfy { $0.styles.contains(.beach) })
        #expect(!results.contains { $0.id == "udaipur" })
    }

    @Test("AC-destinations-3: A guest count hides destinations whose maximum capacity is below it")
    func filtersByGuests() {
        let results = CatalogFilters.destinations(DestinationFilters(guests: 300))
        #expect(results.allSatisfy { $0.guestCapacityMax >= 300 })
        #expect(!results.contains { $0.id == "santorini" })
    }

    @Test("AC-destinations-4: Opening a destination shows its name and description")
    func destinationDetailContent() {
        let destination = WeddingCatalog.destination(id: "udaipur")
        #expect(destination?.name == "Udaipur")
        #expect(destination?.description.contains("Lake Pichola") == true)
    }

    @Test("AC-destinations-5: Saving a destination adds its id to the wedding plan's saved destinations")
    func savingAddsDestination() {
        let repository = InMemoryWeddingRepository()
        repository.update(WeddingPlanPatch(savedDestinationIds: withToggledId(repository.plan.savedDestinationIds, "udaipur")))
        #expect(repository.plan.savedDestinationIds.contains("udaipur"))
        #expect(WeddingPlan.empty.savedDestinationIds.isEmpty)
    }
}
