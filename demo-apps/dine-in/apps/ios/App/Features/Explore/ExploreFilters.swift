import Foundation

nonisolated struct ExploreFilters: Equatable, Sendable {
    var query = ""
    var cuisines: Set<CuisineId> = []
    var neighbourhoods: Set<String> = []
    var priceLevels: Set<Int> = []
    var minRating: Double?
    var availableToday = false
    var collection: CollectionId?

    static let ratingOptions: [Double] = [4.5, 4.7, 4.8]
    static let priceLevelOptions = [1, 2, 3, 4]

    /// The badge count. The query isn't counted.
    var activeCount: Int {
        [!cuisines.isEmpty, !neighbourhoods.isEmpty, !priceLevels.isEmpty, minRating != nil, availableToday, collection != nil]
            .filter { $0 }.count
    }

    var hasActiveFilters: Bool { activeCount > 0 }

    /// Everything except the query, reset.
    func clearingFilters() -> ExploreFilters {
        ExploreFilters(query: query)
    }

    func matches(_ restaurant: Restaurant, now: Date) -> Bool {
        if !query.trimmingCharacters(in: .whitespaces).isEmpty {
            let fields = [restaurant.name, restaurant.cuisine.label, restaurant.neighbourhood, restaurant.tagline]
                + restaurant.collections.map(\.title) + restaurant.amenities.map(\.label)
            guard fields.contains(where: { TextSearch.matches($0, query) }) else { return false }
        }
        if !cuisines.isEmpty && !cuisines.contains(restaurant.cuisine) { return false }
        if !neighbourhoods.isEmpty && !neighbourhoods.contains(restaurant.neighbourhood) { return false }
        if !priceLevels.isEmpty && !priceLevels.contains(restaurant.priceLevel) { return false }
        if let minRating, restaurant.rating < minRating { return false }
        if availableToday && DemoAvailability.today(restaurant, now: now) != .available { return false }
        if let collection, !restaurant.collections.contains(collection) { return false }
        return true
    }

    func apply(to restaurants: [Restaurant], sort: ExploreSort, now: Date) -> [Restaurant] {
        sort.sorted(restaurants.filter { matches($0, now: now) })
    }

    /// "45" for 4.5, as used in test IDs.
    static func ratingKey(_ rating: Double?) -> String {
        guard let rating else { return "any" }
        return String(Int((rating * 10).rounded()))
    }
}

nonisolated enum ExploreSort: String, CaseIterable, Sendable, Identifiable {
    case popularity, rating, distance

    var id: Self { self }

    var label: String {
        switch self {
        case .popularity: Strings.exploreSortPopularity
        case .rating: Strings.exploreSortRating
        case .distance: Strings.exploreSortDistance
        }
    }

    /// Ties keep catalog order.
    func sorted(_ restaurants: [Restaurant]) -> [Restaurant] {
        let indexed = restaurants.enumerated().map { ($0.offset, $0.element) }
        return indexed.sorted { lhs, rhs in
            let (a, b) = (lhs.1, rhs.1)
            switch self {
            case .popularity:
                if a.reviewCount != b.reviewCount { return a.reviewCount > b.reviewCount }
            case .rating:
                if a.rating != b.rating { return a.rating > b.rating }
                if a.reviewCount != b.reviewCount { return a.reviewCount > b.reviewCount }
            case .distance:
                if a.distanceKm != b.distanceKm { return a.distanceKm < b.distanceKm }
            }
            return lhs.0 < rhs.0
        }.map(\.1)
    }
}

nonisolated enum ExploreViewMode: String, Sendable {
    case list, grid

    static let storageKey = "explore.viewMode"
}

/// Explore's device-wide settings: the grid or list choice, shared by all members.
protocol ExploreRepository: AnyObject {
    var viewMode: ExploreViewMode { get }
    func setViewMode(_ mode: ExploreViewMode)
}

final class UserDefaultsExploreRepository: ExploreRepository {
    private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
    }

    var viewMode: ExploreViewMode {
        defaults.string(forKey: ExploreViewMode.storageKey).flatMap(ExploreViewMode.init(rawValue:)) ?? .list
    }

    func setViewMode(_ mode: ExploreViewMode) {
        defaults.set(mode.rawValue, forKey: ExploreViewMode.storageKey)
    }
}

final class InMemoryExploreRepository: ExploreRepository {
    private(set) var viewMode: ExploreViewMode

    init(viewMode: ExploreViewMode = .list) {
        self.viewMode = viewMode
    }

    func setViewMode(_ mode: ExploreViewMode) {
        viewMode = mode
    }
}
