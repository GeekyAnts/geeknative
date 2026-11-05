import Foundation
import Observation

/// The member's favourite restaurants. Observable, so every heart in the app updates at once.
protocol SavedRepository: AnyObject {
    /// Most recently saved first.
    var savedIds: [String] { get }
    func ids() -> [String]
    /// Returns the new saved state.
    @discardableResult func toggle(_ restaurantId: String) -> Bool
    func isSaved(_ restaurantId: String) -> Bool
}

nonisolated enum SavedStorage {
    static func key(for email: String) -> String { "saved.\(email.lowercased())" }
}

@Observable
class BaseSavedRepository: SavedRepository {
    private(set) var savedIds: [String]

    init(savedIds: [String]) {
        var seen = Set<String>()
        self.savedIds = savedIds.filter { seen.insert($0).inserted }
    }

    func ids() -> [String] { savedIds }

    func isSaved(_ restaurantId: String) -> Bool {
        savedIds.contains(restaurantId)
    }

    @discardableResult
    func toggle(_ restaurantId: String) -> Bool {
        if let index = savedIds.firstIndex(of: restaurantId) {
            savedIds.remove(at: index)
        } else {
            savedIds.insert(restaurantId, at: 0)
        }
        persist(savedIds)
        return isSaved(restaurantId)
    }

    func persist(_ ids: [String]) {}
}

/// Keeps saved restaurant IDs in UserDefaults under `saved.<email>` as a JSON array.
final class UserDefaultsSavedRepository: BaseSavedRepository {
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let key: String

    init(defaults: UserDefaults, email: String) {
        self.defaults = defaults
        key = SavedStorage.key(for: email)
        let stored = defaults.string(forKey: key).flatMap { try? JSONDecoder().decode([String].self, from: Data($0.utf8)) } ?? []
        super.init(savedIds: stored)
    }

    override func persist(_ ids: [String]) {
        let data = (try? JSONEncoder().encode(ids)) ?? Data("[]".utf8)
        defaults.set(String(decoding: data, as: UTF8.self), forKey: key)
    }
}

/// Keeps saved IDs in memory, for previews and tests.
final class InMemorySavedRepository: BaseSavedRepository {
    init(ids: [String] = []) {
        super.init(savedIds: ids)
    }
}
