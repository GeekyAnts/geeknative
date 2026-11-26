/// Screens that can be pushed onto a tab's navigation stack. Names match spec/navigation.md.
enum Route: Hashable {
    case city(destinationId: String)
    case place(placeId: String)
    case explore(q: String?, category: String?)
    case planner(destinationId: String?)
    case itinerary(tripId: String)
    case settings
}

enum AppTab: String, Hashable, CaseIterable {
    case home
    case explore
    case trips
    case saved
    case profile
}
