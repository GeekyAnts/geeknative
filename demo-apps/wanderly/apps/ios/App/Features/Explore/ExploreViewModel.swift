import Foundation
import Observation

@Observable
final class ExploreViewModel {
    var query: String
    var category: String?

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let navigation: AppNavigation
    @ObservationIgnored private let isolated: Bool

    init(
        catalogRepository: any CatalogRepository,
        navigation: AppNavigation,
        initialQuery: String? = nil,
        initialCategory: String? = nil,
        isolated: Bool = false
    ) {
        self.catalogRepository = catalogRepository
        self.navigation = navigation
        self.isolated = isolated
        if isolated {
            self.query = initialQuery ?? ""
            self.category = initialCategory
        } else {
            self.query = navigation.exploreQuery
            self.category = navigation.exploreCategory
        }
    }

    convenience init(container: AppContainer, initialQuery: String? = nil, initialCategory: String? = nil, isolated: Bool = false) {
        self.init(
            catalogRepository: container.catalogRepository,
            navigation: container.navigation,
            initialQuery: initialQuery,
            initialCategory: initialCategory,
            isolated: isolated
        )
    }

    var catalog: Catalog { catalogRepository.catalog }
    var fallbackImageURL: String { catalog.fallbackImageUrl }

    var destinations: [Destination] {
        catalog.destinations.filter { matches(destination: $0) }
    }

    var places: [Place] {
        let matching = catalog.places.filter { matches(place: $0) }
        if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && category == nil {
            return matching.filter(\.popular) + matching.filter { !$0.popular }
        }
        return matching
    }

    var isEmpty: Bool {
        destinations.isEmpty && places.isEmpty
    }

    func syncFromNavigation() {
        guard !isolated else { return }
        query = navigation.exploreQuery
        category = navigation.exploreCategory
    }

    func commitQuery() {
        guard !isolated else { return }
        navigation.exploreQuery = query
    }

    func toggleCategory(_ category: TravelCategory) {
        if self.category == category.rawValue {
            self.category = nil
        } else {
            self.category = category.rawValue
        }
        if !isolated {
            navigation.exploreCategory = self.category
        }
    }

    func clearFilters() {
        query = ""
        category = nil
        if !isolated {
            navigation.exploreQuery = ""
            navigation.exploreCategory = nil
        }
    }

    func openCity(_ destination: Destination) {
        navigation.openCity(destinationId: destination.id)
    }

    func openPlace(_ place: Place) {
        navigation.openPlace(placeId: place.id)
    }

    func destinationName(for place: Place) -> String {
        catalog.destination(id: place.destinationId)?.name ?? place.destinationId
    }

    private func matches(destination: Destination) -> Bool {
        matchesQuery(destination) && matchesCategory { destination.categories.contains($0) }
    }

    private func matches(place: Place) -> Bool {
        matchesQuery(place) && matchesCategory { $0 == place.category }
    }

    private func matchesCategory(_ contains: (String) -> Bool) -> Bool {
        guard let category else { return true }
        return contains(category)
    }

    private func matchesQuery(_ destination: Destination) -> Bool {
        let q = normalizedQuery
        guard !q.isEmpty else { return true }
        return destination.name.localizedCaseInsensitiveContains(q)
            || destination.country.localizedCaseInsensitiveContains(q)
            || destination.tagline.localizedCaseInsensitiveContains(q)
            || destination.description.localizedCaseInsensitiveContains(q)
    }

    private func matchesQuery(_ place: Place) -> Bool {
        let q = normalizedQuery
        guard !q.isEmpty else { return true }
        return place.name.localizedCaseInsensitiveContains(q)
            || place.summary.localizedCaseInsensitiveContains(q)
            || place.description.localizedCaseInsensitiveContains(q)
            || place.location.localizedCaseInsensitiveContains(q)
    }

    private var normalizedQuery: String {
        query.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
