import Foundation
import Observation

@Observable
final class HomeViewModel {
    var location: String
    var date: Date
    var hasDate: Bool
    var guests: String
    var budget: String

    @ObservationIgnored private let repository: any WeddingRepository

    init(repository: any WeddingRepository) {
        self.repository = repository
        location = repository.plan.searchLocation
        if let stored = ISODate.date(from: repository.plan.searchDate) {
            date = stored
            hasDate = true
        } else {
            date = Date()
            hasDate = false
        }
        guests = repository.plan.searchGuests > 0 ? String(repository.plan.searchGuests) : ""
        budget = repository.plan.searchBudget > 0 ? String(repository.plan.searchBudget) : ""
    }

    var featured: [Destination] { WeddingCatalog.destinations }
    var teaserExperiences: [Experience] { Array(WeddingCatalog.experiences.prefix(6)) }
    var packages: [WeddingPackage] { WeddingCatalog.packages }

    func submitSearch() {
        let guestCount = CatalogFormat.parsePositiveInt(guests)
        let budgetAmount = CatalogFormat.parsePositiveInt(budget)
        let dateString = hasDate ? ISODate.string(from: date) : ""
        repository.update(
            WeddingPlanPatch(
                date: dateString.isEmpty ? nil : dateString,
                guestCount: guestCount > 0 ? guestCount : nil,
                searchLocation: location,
                searchDate: dateString,
                searchGuests: guestCount,
                searchBudget: budgetAmount
            )
        )
    }
}
