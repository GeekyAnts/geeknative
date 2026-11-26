import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let weddingRepository: any WeddingRepository

    init(settingsRepository: any SettingsRepository, weddingRepository: any WeddingRepository) {
        self.settingsRepository = settingsRepository
        self.weddingRepository = weddingRepository
    }

    static func live() -> AppContainer {
        AppContainer(
            settingsRepository: screenshotSettings() ?? UserDefaultsSettingsRepository(defaults: .standard),
            weddingRepository: screenshotPlan() ?? UserDefaultsWeddingRepository(defaults: .standard)
        )
    }

    /// The plan web shots store under `wedding.plan` and Android seeds for capture, so the wedding
    /// screen shows the same date, destination, venue and guest count.
    private static func screenshotPlan() -> (any WeddingRepository)? {
        let arguments = ProcessInfo.processInfo.arguments
        guard arguments.contains("-screenshotScreen") else { return nil }
        func value(_ flag: String) -> String? {
            guard let index = arguments.firstIndex(of: flag), index + 1 < arguments.count else { return nil }
            return arguments[index + 1]
        }
        let destinationId = value("-screenshotDestinationId") ?? "udaipur"
        let venueId = value("-screenshotVenueId") ?? "udaipur-taj-lake"
        let plan = WeddingPlan(
            date: "2027-02-14",
            destinationId: destinationId,
            venueId: venueId,
            guestCount: 120,
            budget: 180000,
            packageId: "royal",
            bookingStatus: .enquirySent,
            savedDestinationIds: [destinationId, "santorini"],
            savedVenueIds: [venueId],
            completedTaskIds: ["venue"],
            selectedExperienceIds: ["photography", "florals"],
            searchLocation: "",
            searchDate: "",
            searchGuests: 0,
            searchBudget: 0
        )
        return InMemoryWeddingRepository(plan: plan)
    }

    /// Screenshot capture passes `-screenshotAppearance light|dark`. Honor it even when a previous
    /// launch left a different appearance in UserDefaults, and don't write that choice back.
    private static func screenshotSettings() -> (any SettingsRepository)? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-screenshotAppearance"),
              index + 1 < arguments.count,
              let appearance = Appearance(rawValue: arguments[index + 1]) else { return nil }
        return InMemorySettingsRepository(appearance: appearance)
    }

    /// In-memory dependencies, for previews and tests.
    static func preview() -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            weddingRepository: InMemoryWeddingRepository()
        )
    }
}
