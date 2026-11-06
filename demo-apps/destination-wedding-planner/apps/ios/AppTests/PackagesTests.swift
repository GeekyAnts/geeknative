import Foundation
import Testing
@testable import App

@Suite("Packages")
struct PackagesTests {
    @Test("AC-packages-1: Packages shows Intimate, Grand, Royal Luxury and Bespoke")
    func showsFourPackages() {
        #expect(WeddingCatalog.packages.map(\.id) == ["intimate", "grand", "royal", "bespoke"])
    }

    @Test("AC-packages-2: Changing guest count updates the displayed total")
    func guestCountUpdatesTotal() {
        let pack = WeddingCatalog.packages[0]
        let small = CatalogFilters.budgetBreakdown(package: pack, guests: pack.includedGuests, selectedExperienceIds: [])
        let large = CatalogFilters.budgetBreakdown(package: pack, guests: pack.includedGuests + 10, selectedExperienceIds: [])
        #expect(large.total == small.total + 10 * pack.extraGuestPrice)
        #expect(large.catering > small.catering)
    }

    @Test("AC-packages-3: Selecting a package stores its id on the wedding plan")
    func selectingStoresPackage() {
        let repository = InMemoryWeddingRepository()
        repository.update(WeddingPlanPatch(budget: 280000, packageId: "royal"))
        #expect(repository.plan.packageId == "royal")
    }
}
