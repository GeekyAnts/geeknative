import Foundation
import Testing
@testable import App

@Suite("Profile")
struct ProfileTests {
    @Test("AC-profile-1: The traveler can change name and email, and the new values are still there after a restart")
    func nameEmailPersist() {
        withFreshDefaults { defaults in
            let repository = UserDefaultsProfileRepository(defaults: defaults)
            let viewModel = ProfileViewModel(profileRepository: repository, navigation: AppNavigation())
            viewModel.name = "Ada Lovelace"
            viewModel.email = "ada@example.com"
            viewModel.commitIdentity()
            let relaunched = UserDefaultsProfileRepository(defaults: defaults)
            #expect(relaunched.profile.displayName == "Ada Lovelace")
            #expect(relaunched.profile.email == "ada@example.com")
        }
    }

    @Test("AC-profile-2: Usual travelers, budget and favorite categories persist and prefill Trip planner")
    func preferencesPrefillPlanner() {
        withFreshDefaults { defaults in
            let profile = UserDefaultsProfileRepository(defaults: defaults)
            let viewModel = ProfileViewModel(profileRepository: profile, navigation: AppNavigation())
            viewModel.setTravelers(4)
            viewModel.setBudget(.luxury)
            viewModel.toggleInterest(.food)
            viewModel.toggleInterest(.beaches)

            let planner = TripPlannerViewModel(
                destinationId: "bali",
                catalogRepository: InMemoryCatalogRepository.bundled(),
                tripRepository: InMemoryTripRepository(),
                profileRepository: UserDefaultsProfileRepository(defaults: defaults),
                navigation: AppNavigation()
            )
            #expect(planner.travelers == 4)
            #expect(planner.budgetBand == .luxury)
            #expect(planner.interests.contains("food"))
            #expect(planner.interests.contains("beaches"))
        }
    }

    @Test("AC-profile-4: Profile shows the app version and build number")
    func showsVersion() {
        let text = ProfileViewModel(
            profileRepository: InMemoryProfileRepository(),
            navigation: AppNavigation()
        ).versionText
        #expect(text.contains(AppIdentity.version))
        #expect(text.contains(String(AppIdentity.build)))
    }

    private func withFreshDefaults(_ body: (UserDefaults) -> Void) {
        let name = "ProfileTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        body(defaults)
    }
}
