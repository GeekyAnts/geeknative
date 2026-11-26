import Foundation
import Observation

@Observable
final class ProfileViewModel {
    var name: String
    var email: String
    var travelers: Int
    var budgetBand: BudgetBand
    var interests: Set<String>

    @ObservationIgnored private let profileRepository: any ProfileRepository
    @ObservationIgnored private let navigation: AppNavigation

    init(profileRepository: any ProfileRepository, navigation: AppNavigation) {
        self.profileRepository = profileRepository
        self.navigation = navigation
        let profile = profileRepository.profile
        self.name = profile.displayName
        self.email = profile.email
        self.travelers = profile.defaultTravelers
        self.budgetBand = profile.budgetBand
        self.interests = Set(profile.preferredCategories)
    }

    convenience init(container: AppContainer) {
        self.init(profileRepository: container.profileRepository, navigation: container.navigation)
    }

    var displayedName: String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? Strings.profileDefaultName : name
    }

    var initials: String {
        Profile(displayName: displayedName, email: email, defaultTravelers: travelers, budgetBand: budgetBand, preferredCategories: []).initials
    }

    var versionText: String {
        Strings.settingsAboutVersion(version: AppIdentity.version, build: AppIdentity.build)
    }

    func commitIdentity() {
        persist()
    }

    func setTravelers(_ value: Int) {
        travelers = min(max(value, 1), 8)
        persist()
    }

    func setBudget(_ band: BudgetBand) {
        budgetBand = band
        persist()
    }

    func toggleInterest(_ category: TravelCategory) {
        if interests.contains(category.rawValue) {
            interests.remove(category.rawValue)
        } else {
            interests.insert(category.rawValue)
        }
        persist()
    }

    func openSettings() {
        navigation.openSettings()
    }

    private func persist() {
        profileRepository.update(
            Profile(
                displayName: name,
                email: email,
                defaultTravelers: travelers,
                budgetBand: budgetBand,
                preferredCategories: TravelCategory.allCases.map(\.rawValue).filter { interests.contains($0) }
            )
        )
    }
}
