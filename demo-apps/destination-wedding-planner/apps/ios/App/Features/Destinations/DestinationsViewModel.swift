import Foundation
import Observation

@Observable
final class DestinationsViewModel {
    var style: WeddingStyle?
    var location: String = ""
    var guests: String = ""
    var budget: String = ""

    @ObservationIgnored private let repository: any WeddingRepository

    init(repository: any WeddingRepository) {
        self.repository = repository
        syncFromPlan()
    }

    var results: [Destination] {
        CatalogFilters.destinations(
            DestinationFilters(
                location: location,
                style: style,
                guests: CatalogFormat.parsePositiveInt(guests),
                budget: CatalogFormat.parsePositiveInt(budget)
            )
        )
    }

    var seasonal: [Destination] {
        CatalogFilters.seasonalDestinations()
    }

    func syncFromPlan() {
        location = repository.plan.searchLocation
        guests = repository.plan.searchGuests > 0 ? String(repository.plan.searchGuests) : ""
        budget = repository.plan.searchBudget > 0 ? String(repository.plan.searchBudget) : ""
    }

    func persistFilters() {
        repository.update(
            WeddingPlanPatch(
                searchLocation: location,
                searchGuests: CatalogFormat.parsePositiveInt(guests),
                searchBudget: CatalogFormat.parsePositiveInt(budget)
            )
        )
    }
}
