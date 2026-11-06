import Foundation
import Testing
@testable import App

@Suite("Wedding")
struct WeddingTests {
    @Test("AC-wedding-1: With a future date stored, Wedding shows the number of days remaining")
    func showsDaysRemaining() {
        #expect(CatalogFormat.daysRemaining("2026-11-16", today: date("2026-11-06T12:00:00Z")) == 10)
        #expect(CatalogFormat.daysRemaining("2026-11-06", today: date("2026-11-06T12:00:00Z")) == 0)
    }

    @Test("AC-wedding-2: Wedding shows the selected destination and venue names when those ids are set")
    func showsSelectedPlaceNames() {
        let repository = InMemoryWeddingRepository(
            plan: mergePlan(.empty, WeddingPlanPatch(destinationId: "udaipur", venueId: "udaipur-taj-lake"))
        )
        #expect(repository.plan.destinationId == "udaipur")
        #expect(repository.plan.venueId == "udaipur-taj-lake")
        #expect(WeddingCatalog.destination(id: repository.plan.destinationId)?.name == "Udaipur")
        #expect(WeddingCatalog.venue(id: repository.plan.venueId)?.name == "Taj Lake Palace")
    }

    @Test("AC-wedding-3: Toggling a task persists it as completed after a reload")
    func togglingTaskPersists() {
        let repository = InMemoryWeddingRepository()
        repository.update(WeddingPlanPatch(completedTaskIds: withToggledId(repository.plan.completedTaskIds, "venue")))
        #expect(repository.plan.completedTaskIds.contains("venue"))
    }

    @Test("AC-wedding-4: Saved destinations on the plan appear in the saved list")
    func savedDestinationsAppear() {
        let repository = InMemoryWeddingRepository(
            plan: mergePlan(.empty, WeddingPlanPatch(savedDestinationIds: ["santorini"]))
        )
        #expect(repository.plan.savedDestinationIds == ["santorini"])
        #expect(WeddingCatalog.destination(id: "santorini")?.name == "Santorini")
    }

    @Test("AC-wedding-5: Changing guest count persists on the wedding plan")
    func guestCountPersists() {
        let repository = InMemoryWeddingRepository()
        repository.update(WeddingPlanPatch(guestCount: 120))
        #expect(repository.plan.guestCount == 120)
    }

    private func date(_ iso: String) -> Date {
        ISO8601DateFormatter().date(from: iso)!
    }
}
