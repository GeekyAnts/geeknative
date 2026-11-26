import Foundation
import Observation

@Observable
final class TripPlannerViewModel {
    var destinationId: String?
    var startDate: Date
    var endDate: Date
    var travelers: Int
    var budgetBand: BudgetBand
    var interests: Set<String>
    var validationError: PlannerValidationError?
    var showStartPicker = false
    var showEndPicker = false

    @ObservationIgnored private let catalogRepository: any CatalogRepository
    @ObservationIgnored private let tripRepository: any TripRepository
    @ObservationIgnored private let profileRepository: any ProfileRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(
        destinationId: String?,
        catalogRepository: any CatalogRepository,
        tripRepository: any TripRepository,
        profileRepository: any ProfileRepository,
        navigation: AppNavigation
    ) {
        self.catalogRepository = catalogRepository
        self.tripRepository = tripRepository
        self.profileRepository = profileRepository
        self.navigation = navigation
        let profile = profileRepository.profile
        let today = Date()
        self.destinationId = destinationId ?? catalogRepository.catalog.destinations.first?.id
        if destinationId == nil {
            // Unspecified destination stays empty so Generate can require a choice.
            self.destinationId = nil
        }
        self.startDate = today
        self.endDate = today
        self.travelers = profile.defaultTravelers
        self.budgetBand = profile.budgetBand
        self.interests = Set(profile.preferredCategories)
    }

    convenience init(destinationId: String?, container: AppContainer) {
        self.init(
            destinationId: destinationId,
            catalogRepository: container.catalogRepository,
            tripRepository: container.tripRepository,
            profileRepository: container.profileRepository,
            navigation: container.navigation
        )
    }

    var destinations: [Destination] { catalogRepository.catalog.destinations }

    var destinationErrorVisible: Bool { validationError == .destination }
    var dateErrorVisible: Bool { validationError == .date }
    var rangeErrorVisible: Bool { validationError == .range }

    func toggleInterest(_ category: TravelCategory) {
        if interests.contains(category.rawValue) {
            interests.remove(category.rawValue)
        } else {
            interests.insert(category.rawValue)
        }
    }

    func generate() {
        validationError = nil
        guard let destinationId, let destination = catalogRepository.catalog.destination(id: destinationId) else {
            validationError = .destination
            return
        }
        let start = TripDates.string(from: startDate)
        let end = TripDates.string(from: endDate)
        guard let inclusive = TripDates.daysInclusive(from: start, to: end), inclusive >= 1 else {
            validationError = .date
            return
        }
        if inclusive > TripGeneration.maxStayDays {
            validationError = .range
            return
        }
        do {
            let trip = try tripRepository.generate(
                destination: destination,
                startDate: start,
                endDate: end,
                travelers: travelers,
                budgetBand: budgetBand,
                interests: TravelCategory.allCases.map(\.rawValue).filter { interests.contains($0) },
                catalog: catalogRepository.catalog
            )
            navigation.openItinerary(tripId: trip.id)
        } catch let error as PlannerValidationError {
            validationError = error
        } catch {
            validationError = .date
        }
    }
}
