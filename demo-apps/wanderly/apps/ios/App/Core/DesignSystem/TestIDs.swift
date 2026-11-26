/// Accessibility identifiers. Interpolation names match spec placeholders (`{destinationId}`, `{placeId}`, …).
enum TestIDs {
    static func homeTrending(_ destinationId: String) -> String { "home.trending.\(destinationId)" }
    static func homePopular(_ placeId: String) -> String { "home.popular.\(placeId)" }
    static func homeInspiration(_ destinationId: String) -> String { "home.inspiration.\(destinationId)" }
    static func homeCategory(_ category: String) -> String { "home.category.\(category)" }

    static func exploreDestination(_ destinationId: String) -> String { "explore.destination.\(destinationId)" }
    static func explorePlace(_ placeId: String) -> String { "explore.place.\(placeId)" }
    static func exploreCategory(_ category: String) -> String { "explore.category.\(category)" }

    static func cityPlace(_ placeId: String) -> String { "city.place.\(placeId)" }

    static func placeTrip(_ tripId: String) -> String { "place.trip.\(tripId)" }

    static func plannerInterest(_ category: String) -> String { "planner.interest.\(category)" }
    static func plannerBudget(_ band: BudgetBand) -> String {
        switch band {
        case .value: "planner.budget.value"
        case .mid: "planner.budget.mid"
        case .luxury: "planner.budget.luxury"
        }
    }

    static func itineraryDay(_ dayIndex: Int) -> String { "itinerary.day.\(dayIndex)" }
    static func itineraryAdd(_ dayIndex: Int) -> String { "itinerary.add.\(dayIndex)" }

    static func itineraryItem(_ itemId: String) -> String { "itinerary.item.\(itemId)" }
    static func itineraryComplete(_ itemId: String) -> String { "itinerary.complete.\(itemId)" }
    static func itineraryRemove(_ itemId: String) -> String { "itinerary.remove.\(itemId)" }
    static func itineraryMoveUp(_ itemId: String) -> String { "itinerary.moveUp.\(itemId)" }
    static func itineraryMoveDown(_ itemId: String) -> String { "itinerary.moveDown.\(itemId)" }

    static func tripsCard(_ tripId: String) -> String { "trips.card.\(tripId)" }
    static func tripsDelete(_ tripId: String) -> String { "trips.delete.\(tripId)" }

    static func savedDestination(_ destinationId: String) -> String { "saved.destination.\(destinationId)" }
    static func savedPlace(_ placeId: String) -> String { "saved.place.\(placeId)" }
    static func savedUnsave(_ id: String) -> String { "saved.unsave.\(id)" }

    static func profileInterest(_ category: String) -> String { "profile.interest.\(category)" }
    static func profileBudget(_ band: BudgetBand) -> String {
        switch band {
        case .value: "profile.budget.value"
        case .mid: "profile.budget.mid"
        case .luxury: "profile.budget.luxury"
        }
    }
}
