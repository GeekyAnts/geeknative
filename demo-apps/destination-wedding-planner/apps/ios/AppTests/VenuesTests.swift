import Foundation
import Testing
@testable import App

@Suite("Venues")
struct VenuesTests {
    @Test("AC-venues-1: Venues shows every catalog venue when no filter is applied")
    func showsEveryVenue() {
        let results = CatalogFilters.venues(VenueFilters())
        #expect(results.count == WeddingCatalog.venues.count)
    }

    @Test("AC-venues-2: Filtering by destination shows only that destination's venues")
    func filtersByDestination() {
        let results = CatalogFilters.venues(VenueFilters(destinationId: "udaipur"))
        #expect(results.allSatisfy { $0.destinationId == "udaipur" })
        #expect(results.map(\.id).contains("udaipur-taj-lake"))
    }

    @Test("AC-venues-3: Venue detail shows capacity, from-price and amenities")
    func venueDetailContent() {
        let venue = WeddingCatalog.venue(id: "udaipur-taj-lake")
        #expect(venue?.capacity == 180)
        #expect(venue?.priceFrom == 120000)
        #expect((venue?.amenities.count ?? 0) > 0)
    }

    @Test("AC-venues-5: Saving a venue adds its id to the wedding plan's saved venues")
    func savingAddsVenue() {
        let repository = InMemoryWeddingRepository()
        repository.update(WeddingPlanPatch(savedVenueIds: withToggledId(repository.plan.savedVenueIds, "udaipur-taj-lake")))
        #expect(repository.plan.savedVenueIds.contains("udaipur-taj-lake"))
    }
}
