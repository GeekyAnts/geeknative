import Foundation
import Observation

@Observable
final class VenuesViewModel {
    var destinationId: String = ""
    var guests: String = ""
    var budget: String = ""

    var results: [Venue] {
        CatalogFilters.venues(
            VenueFilters(
                destinationId: destinationId,
                guests: CatalogFormat.parsePositiveInt(guests),
                budget: CatalogFormat.parsePositiveInt(budget)
            )
        )
    }
}
