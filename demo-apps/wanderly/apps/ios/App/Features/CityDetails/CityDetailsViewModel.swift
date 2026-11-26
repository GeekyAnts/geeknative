import Foundation
import Observation

@Observable
final class CityDetailsViewModel {
    let destinationId: String
    private(set) var isSaved: Bool

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let savedRepository: any SavedRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        destinationId: String,
        catalogRepository: any CatalogRepository,
        savedRepository: any SavedRepository,
        navigation: AppNavigation
    ) {
        self.destinationId = destinationId
        self.catalogRepository = catalogRepository
        self.savedRepository = savedRepository
        self.navigation = navigation
        self.isSaved = savedRepository.isSaved(id: destinationId)
    }

    convenience init(destinationId: String, container: AppContainer) {
        self.init(
            destinationId: destinationId,
            catalogRepository: container.catalogRepository,
            savedRepository: container.savedRepository,
            navigation: container.navigation
        )
    }

    var destination: Destination? {
        catalogRepository.catalog.destination(id: destinationId)
    }

    var isUnknown: Bool { destination == nil }

    var fallbackImageURL: String { catalogRepository.catalog.fallbackImageUrl }

    func attractions() -> [Place] { places(kind: .attraction) }
    func hotels() -> [Place] { places(kind: .hotel) }
    func restaurants() -> [Place] { places(kind: .restaurant) }
    func activities() -> [Place] { places(kind: .activity) }

    func weatherValue(for destination: Destination) -> String {
        Strings.cityWeatherValue(
            temp: AppFormat.int(destination.weather.tempC),
            summary: destination.weather.summary
        )
    }

    func currencyValue(for destination: Destination) -> String {
        "\(destination.currencySymbol) \(destination.currency)"
    }

    func toggleSave() {
        savedRepository.toggle(id: destinationId, kind: .destination)
        isSaved = savedRepository.isSaved(id: destinationId)
    }

    func planTrip() {
        navigation.openPlanner(destinationId: destinationId)
    }

    func openPlace(_ place: Place) {
        navigation.openPlace(placeId: place.id)
    }

    private func places(kind: PlaceKind) -> [Place] {
        catalogRepository.catalog.places(destinationId: destinationId, kind: kind)
    }
}
