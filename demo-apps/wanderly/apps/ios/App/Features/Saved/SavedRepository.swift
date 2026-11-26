import Foundation
import Observation

nonisolated struct SavedItem: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var kind: SavedKind
}

protocol SavedRepository: AnyObject {
    var items: [SavedItem] { get }
    func isSaved(id: String) -> Bool
    func toggle(id: String, kind: SavedKind)
    func unsave(id: String)
}

enum SavedStorage {
    static let key = "saved.items"
}

@Observable
final class UserDefaultsSavedRepository: SavedRepository {
    private(set) var items: [SavedItem]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        items = Self.load(from: defaults)
    }

    func isSaved(id: String) -> Bool {
        items.contains { $0.id == id }
    }

    func toggle(id: String, kind: SavedKind) {
        if isSaved(id: id) {
            unsave(id: id)
        } else {
            items.insert(SavedItem(id: id, kind: kind), at: 0)
            persist()
        }
    }

    func unsave(id: String) {
        items.removeAll { $0.id == id }
        persist()
    }

    private func persist() {
        persist(items, to: defaults)
    }

    static func load(from defaults: UserDefaults) -> [SavedItem] {
        let data: Data?
        if let stored = defaults.data(forKey: SavedStorage.key) {
            data = stored
        } else if let string = defaults.string(forKey: SavedStorage.key) {
            data = string.data(using: .utf8)
        } else {
            return []
        }
        guard let data, let decoded = try? JSONDecoder().decode([SavedItem].self, from: data) else {
            return []
        }
        var seen = Set<String>()
        return decoded.filter { item in
            if seen.contains(item.id) { return false }
            seen.insert(item.id)
            return true
        }
    }

    private func persist(_ items: [SavedItem], to defaults: UserDefaults) {
        guard let data = try? JSONEncoder().encode(items),
              let string = String(data: data, encoding: .utf8) else { return }
        defaults.set(string, forKey: SavedStorage.key)
    }
}

@Observable
final class InMemorySavedRepository: SavedRepository {
    private(set) var items: [SavedItem]

    init(items: [SavedItem] = []) {
        var seen = Set<String>()
        self.items = items.filter { item in
            if seen.contains(item.id) { return false }
            seen.insert(item.id)
            return true
        }
    }

    func isSaved(id: String) -> Bool {
        items.contains { $0.id == id }
    }

    func toggle(id: String, kind: SavedKind) {
        if isSaved(id: id) {
            unsave(id: id)
        } else {
            items.insert(SavedItem(id: id, kind: kind), at: 0)
        }
    }

    func unsave(id: String) {
        items.removeAll { $0.id == id }
    }
}
