import Foundation
import Observation

/// The member's dining preferences. Stored as JSON under `preferences.<email>`.
nonisolated struct DiningPreferences: Codable, Equatable, Sendable {
    static let partySizeRange = 1...12

    var cuisines: [CuisineId]
    var dietary: [Dietary]
    var seating: Seating
    var partySize: Int
    var reminders: Bool

    static let defaults = DiningPreferences(cuisines: [], dietary: [], seating: .indoor, partySize: 2, reminders: true)

    init(cuisines: [CuisineId], dietary: [Dietary], seating: Seating, partySize: Int, reminders: Bool) {
        self.cuisines = cuisines
        self.dietary = dietary
        self.seating = seating
        self.partySize = partySize
        self.reminders = reminders
    }

    private enum CodingKeys: String, CodingKey {
        case cuisines, dietary, seating, partySize, reminders
    }

    /// Unknown values are dropped; missing fields take the defaults.
    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let defaults = DiningPreferences.defaults
        cuisines = ((try? c.decodeIfPresent([String].self, forKey: .cuisines)) ?? nil)?.compactMap(CuisineId.init(rawValue:)) ?? defaults.cuisines
        dietary = Dietary.ordered(((try? c.decodeIfPresent([String].self, forKey: .dietary)) ?? nil)?.compactMap(Dietary.init(rawValue:)) ?? defaults.dietary)
        seating = ((try? c.decodeIfPresent(String.self, forKey: .seating)) ?? nil).flatMap(Seating.init(rawValue:)) ?? defaults.seating
        let size = ((try? c.decodeIfPresent(Int.self, forKey: .partySize)) ?? nil) ?? defaults.partySize
        partySize = DiningPreferences.partySizeRange.contains(size) ? size : defaults.partySize
        reminders = ((try? c.decodeIfPresent(Bool.self, forKey: .reminders)) ?? nil) ?? defaults.reminders
    }
}

protocol PreferencesRepository: AnyObject {
    var preferences: DiningPreferences { get }
    func load() -> DiningPreferences
    func save(_ preferences: DiningPreferences)
}

nonisolated enum PreferencesStorage {
    static func key(for email: String) -> String { "preferences.\(email.lowercased())" }
}

@Observable
class BasePreferencesRepository: PreferencesRepository {
    private(set) var preferences: DiningPreferences

    init(preferences: DiningPreferences) {
        self.preferences = preferences
    }

    func load() -> DiningPreferences { preferences }

    func save(_ preferences: DiningPreferences) {
        self.preferences = preferences
        persist(preferences)
    }

    func persist(_ preferences: DiningPreferences) {}
}

final class UserDefaultsPreferencesRepository: BasePreferencesRepository {
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let key: String

    init(defaults: UserDefaults, email: String) {
        self.defaults = defaults
        key = PreferencesStorage.key(for: email)
        let stored = defaults.string(forKey: key).flatMap { try? JSONDecoder().decode(DiningPreferences.self, from: Data($0.utf8)) }
        super.init(preferences: stored ?? .defaults)
    }

    override func persist(_ preferences: DiningPreferences) {
        guard let data = try? JSONEncoder().encode(preferences) else { return }
        defaults.set(String(decoding: data, as: UTF8.self), forKey: key)
    }
}

final class InMemoryPreferencesRepository: BasePreferencesRepository {
    override init(preferences: DiningPreferences = .defaults) {
        super.init(preferences: preferences)
    }
}
