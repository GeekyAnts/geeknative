import Foundation
import Observation

@Observable
final class HomeViewModel {
    var query: String = ""

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(catalogRepository: any CatalogRepository, navigation: AppNavigation) {
        self.catalogRepository = catalogRepository
        self.navigation = navigation
    }

    convenience init(container: AppContainer) {
        self.init(catalogRepository: container.catalogRepository, navigation: container.navigation)
    }

    var catalog: Catalog { catalogRepository.catalog }
    var loadFailed: Bool { catalogRepository.loadFailed }
    var featured: Destination? { catalog.featured }
    var trending: [Destination] { catalog.trending }
    var popular: [Place] { catalog.popularPlaces }
    var inspiration: [Destination] { catalog.inspiration }
    var fallbackImageURL: String { catalog.fallbackImageUrl }

    func destinationName(for place: Place) -> String {
        catalog.destination(id: place.destinationId)?.name ?? place.destinationId
    }

    func submitSearch() {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        navigation.openExplore(q: trimmed.isEmpty ? nil : trimmed, category: nil)
    }

    func selectCategory(_ category: TravelCategory) {
        navigation.openExplore(q: nil, category: category.rawValue)
    }

    func openCity(_ destination: Destination) {
        navigation.openCity(destinationId: destination.id)
    }

    func openPlace(_ place: Place) {
        navigation.openPlace(placeId: place.id)
    }

    func retry() {
        catalogRepository.reload()
    }
}
