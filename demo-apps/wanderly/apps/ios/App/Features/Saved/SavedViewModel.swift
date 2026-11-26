import Foundation
import Observation

@Observable
final class SavedViewModel {
    private(set) var stamp = 0
    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let savedRepository: any SavedRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        catalogRepository: any CatalogRepository,
        savedRepository: any SavedRepository,
        navigation: AppNavigation
    ) {
        self.catalogRepository = catalogRepository
        self.savedRepository = savedRepository
        self.navigation = navigation
    }

    convenience init(container: AppContainer) {
        self.init(
            catalogRepository: container.catalogRepository,
            savedRepository: container.savedRepository,
            navigation: container.navigation
        )
    }

    var fallbackImageURL: String { catalogRepository.catalog.fallbackImageUrl }

    func refresh() {
        stamp += 1
    }

    var destinations: [Destination] {
        _ = stamp
        return savedRepository.items.compactMap { item in
            guard item.kind == .destination else { return nil }
            return catalogRepository.catalog.destination(id: item.id)
        }
    }

    var places: [Place] {
        _ = stamp
        return savedRepository.items.compactMap { item in
            guard item.kind != .destination else { return nil }
            return catalogRepository.catalog.place(id: item.id)
        }
    }

    var isEmpty: Bool {
        destinations.isEmpty && places.isEmpty
    }

    func destinationName(for place: Place) -> String {
        catalogRepository.catalog.destination(id: place.destinationId)?.name ?? place.destinationId
    }

    func unsave(id: String) {
        savedRepository.unsave(id: id)
        refresh()
    }

    func openDestination(_ destination: Destination) {
        navigation.openCity(destinationId: destination.id)
    }

    func openPlace(_ place: Place) {
        navigation.openPlace(placeId: place.id)
    }
}
