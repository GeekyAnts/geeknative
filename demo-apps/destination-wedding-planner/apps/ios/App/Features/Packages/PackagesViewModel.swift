import Foundation
import Observation

@Observable
final class PackagesViewModel {
    var selectedId: String
    var guests: Int
    var addons: [String]

    @ObservationIgnored private let repository: any WeddingRepository

    init(repository: any WeddingRepository) {
        self.repository = repository
        selectedId = repository.plan.packageId.isEmpty ? "intimate" : repository.plan.packageId
        guests = min(500, max(2, repository.plan.guestCount))
        addons = repository.plan.selectedExperienceIds
    }

    var selected: WeddingPackage {
        WeddingCatalog.package(id: selectedId) ?? WeddingCatalog.packages[0]
    }

    var breakdown: BudgetBreakdown {
        CatalogFilters.budgetBreakdown(package: selected, guests: guests, selectedExperienceIds: addons)
    }

    var isSelected: Bool {
        repository.plan.packageId == selected.id
    }

    func selectPackage() {
        repository.update(
            WeddingPlanPatch(
                guestCount: guests,
                budget: breakdown.total,
                packageId: selected.id,
                selectedExperienceIds: addons
            )
        )
    }
}
