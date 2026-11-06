import Foundation
import Observation

@Observable
final class WeddingViewModel {
    var plan: WeddingPlan
    var guestsText: String
    var budgetText: String
    var date: Date

    @ObservationIgnored private let repository: any WeddingRepository

    init(repository: any WeddingRepository) {
        self.repository = repository
        plan = repository.plan
        guestsText = String(repository.plan.guestCount)
        budgetText = repository.plan.budget > 0 ? String(repository.plan.budget) : ""
        date = ISODate.date(from: repository.plan.date) ?? Date()
    }

    var remaining: Int { CatalogFormat.daysRemaining(plan.date) }
    var destination: Destination? { WeddingCatalog.destination(id: plan.destinationId) }
    var venue: Venue? { WeddingCatalog.venue(id: plan.venueId) }
    var savedDestinations: [Destination] {
        plan.savedDestinationIds.compactMap(WeddingCatalog.destination(id:))
    }
    var savedVenues: [Venue] {
        plan.savedVenueIds.compactMap(WeddingCatalog.venue(id:))
    }

    func refresh() {
        plan = repository.plan
        guestsText = String(plan.guestCount)
        budgetText = plan.budget > 0 ? String(plan.budget) : ""
        if let stored = ISODate.date(from: plan.date) {
            date = stored
        }
    }

    func update(_ patch: WeddingPlanPatch) {
        repository.update(patch)
        refresh()
    }

    func setDate(_ date: Date) {
        self.date = date
        update(WeddingPlanPatch(date: ISODate.string(from: date)))
    }

    func setGuests() {
        let count = CatalogFormat.parsePositiveInt(guestsText)
        update(WeddingPlanPatch(guestCount: count > 0 ? count : plan.guestCount))
    }

    func setBudget() {
        update(WeddingPlanPatch(budget: CatalogFormat.parsePositiveInt(budgetText)))
    }

    func toggleTask(_ id: TaskId) {
        update(WeddingPlanPatch(completedTaskIds: withToggledId(plan.completedTaskIds, id.rawValue)))
    }
}
