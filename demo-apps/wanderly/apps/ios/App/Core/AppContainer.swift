import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let catalogRepository: any CatalogRepository
    let savedRepository: any SavedRepository
    let tripRepository: any TripRepository
    let profileRepository: any ProfileRepository
    let navigation: AppNavigation
    let homeViewModel: HomeViewModel
    let exploreViewModel: ExploreViewModel
    let myTripsViewModel: MyTripsViewModel
    let savedViewModel: SavedViewModel
    let profileViewModel: ProfileViewModel

    init(
        settingsRepository: any SettingsRepository,
        catalogRepository: any CatalogRepository,
        savedRepository: any SavedRepository,
        tripRepository: any TripRepository,
        profileRepository: any ProfileRepository,
        navigation: AppNavigation = AppNavigation()
    ) {
        self.settingsRepository = settingsRepository
        self.catalogRepository = catalogRepository
        self.savedRepository = savedRepository
        self.tripRepository = tripRepository
        self.profileRepository = profileRepository
        self.navigation = navigation
        self.homeViewModel = HomeViewModel(catalogRepository: catalogRepository, navigation: navigation)
        self.exploreViewModel = ExploreViewModel(catalogRepository: catalogRepository, navigation: navigation)
        self.myTripsViewModel = MyTripsViewModel(
            catalogRepository: catalogRepository,
            tripRepository: tripRepository,
            navigation: navigation
        )
        self.savedViewModel = SavedViewModel(
            catalogRepository: catalogRepository,
            savedRepository: savedRepository,
            navigation: navigation
        )
        self.profileViewModel = ProfileViewModel(profileRepository: profileRepository, navigation: navigation)
    }

    static func live() -> AppContainer {
        let defaults = UserDefaults.standard
        return AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: defaults),
            catalogRepository: BundleCatalogRepository(),
            savedRepository: UserDefaultsSavedRepository(defaults: defaults),
            tripRepository: UserDefaultsTripRepository(defaults: defaults),
            profileRepository: UserDefaultsProfileRepository(defaults: defaults)
        )
    }

    /// In-memory dependencies, for previews and tests.
    static func preview() -> AppContainer {
        AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            catalogRepository: InMemoryCatalogRepository.bundled(),
            savedRepository: InMemorySavedRepository(),
            tripRepository: InMemoryTripRepository(),
            profileRepository: InMemoryProfileRepository()
        )
    }
}
