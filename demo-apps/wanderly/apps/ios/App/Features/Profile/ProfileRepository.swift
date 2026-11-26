import Foundation
import Observation

nonisolated struct Profile: Codable, Equatable, Sendable {
    var displayName: String
    var email: String
    var defaultTravelers: Int
    var budgetBand: BudgetBand
    var preferredCategories: [String]

    static let `default` = Profile(
        displayName: "",
        email: "",
        defaultTravelers: 2,
        budgetBand: .mid,
        preferredCategories: []
    )

    var clamped: Profile {
        var copy = self
        copy.defaultTravelers = min(max(copy.defaultTravelers, 1), 8)
        return copy
    }

    var displayedName: String {
        displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? Strings.profileDefaultName
            : displayName
    }

    var initials: String {
        let source = displayedName
        let words = source.split(separator: " ").prefix(2)
        let letters = words.compactMap { $0.first }.map { String($0).uppercased() }
        return letters.joined()
    }
}

protocol ProfileRepository: AnyObject {
    var profile: Profile { get }
    func update(_ profile: Profile)
}

enum ProfileStorage {
    static let key = "profile.data"
}

@Observable
final class UserDefaultsProfileRepository: ProfileRepository {
    private(set) var profile: Profile
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        profile = Self.load(from: defaults)
    }

    func update(_ profile: Profile) {
        self.profile = profile.clamped
        persist()
    }

    static func load(from defaults: UserDefaults) -> Profile {
        let data: Data?
        if let stored = defaults.data(forKey: ProfileStorage.key) {
            data = stored
        } else if let string = defaults.string(forKey: ProfileStorage.key) {
            data = string.data(using: .utf8)
        } else {
            return .default
        }
        guard let data, let decoded = try? JSONDecoder().decode(Profile.self, from: data) else {
            return .default
        }
        return decoded.clamped
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(profile),
              let string = String(data: data, encoding: .utf8) else { return }
        defaults.set(string, forKey: ProfileStorage.key)
    }
}

@Observable
final class InMemoryProfileRepository: ProfileRepository {
    private(set) var profile: Profile

    init(profile: Profile = .default) {
        self.profile = profile.clamped
    }

    func update(_ profile: Profile) {
        self.profile = profile.clamped
    }
}
