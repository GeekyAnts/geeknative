import Foundation
import Observation

/// One product in the cart and its quantity (always 1 or more).
nonisolated struct CartLine: Codable, Hashable, Sendable {
    let productId: String
    var quantity: Int
}

/// The app's one cart. Every screen observes the same instance, so a change shows everywhere at once.
protocol CartRepository: AnyObject {
    /// In the order products were first added.
    var lines: [CartLine] { get }
    func quantity(of productId: String) -> Int
    func add(_ productId: String)
    func remove(_ productId: String)
    func clear()
}

/// Storage key and JSON format, shared with the Android and web apps.
nonisolated enum CartStorage {
    static let key = "cart.items"

    /// `[{"productId":"banana","quantity":2}]`
    static func encode(_ lines: [CartLine]) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        guard let data = try? encoder.encode(lines) else { return "[]" }
        return String(decoding: data, as: UTF8.self)
    }

    /// Drops unknown products and quantities below 1, then merges repeated products into the first
    /// line for that product, adding their quantities. Unreadable data is an empty cart.
    static func decode(_ data: Data?, isKnownProduct: (String) -> Bool) -> [CartLine] {
        guard let data, let lines = try? JSONDecoder().decode([CartLine].self, from: data) else { return [] }
        var merged: [CartLine] = []
        var indexById: [String: Int] = [:]
        for line in lines where line.quantity >= 1 && isKnownProduct(line.productId) {
            if let index = indexById[line.productId] {
                merged[index].quantity += line.quantity
            } else {
                indexById[line.productId] = merged.count
                merged.append(line)
            }
        }
        return merged
    }
}

/// Shared add/remove rules, so both implementations behave the same.
private extension Array where Element == CartLine {
    mutating func add(_ productId: String) {
        if let index = firstIndex(where: { $0.productId == productId }) {
            self[index].quantity += 1
        } else {
            append(CartLine(productId: productId, quantity: 1))
        }
    }

    mutating func remove(_ productId: String) {
        guard let index = firstIndex(where: { $0.productId == productId }) else { return }
        if self[index].quantity > 1 {
            self[index].quantity -= 1
        } else {
            self.remove(at: index)
        }
    }
}

/// Keeps the cart in UserDefaults under `cart.items`, as a JSON string.
@Observable
final class UserDefaultsCartRepository: CartRepository {
    private(set) var lines: [CartLine]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults, catalog: any CatalogRepository) {
        self.defaults = defaults
        let stored = defaults.string(forKey: CartStorage.key).map { Data($0.utf8) } ?? defaults.data(forKey: CartStorage.key)
        lines = CartStorage.decode(stored) { catalog.product(id: $0) != nil }
    }

    func quantity(of productId: String) -> Int {
        lines.first { $0.productId == productId }?.quantity ?? 0
    }

    func add(_ productId: String) {
        lines.add(productId)
        save()
    }

    func remove(_ productId: String) {
        lines.remove(productId)
        save()
    }

    func clear() {
        lines = []
        save()
    }

    private func save() {
        defaults.set(CartStorage.encode(lines), forKey: CartStorage.key)
    }
}

/// Keeps the cart in memory, for previews and tests.
@Observable
final class InMemoryCartRepository: CartRepository {
    private(set) var lines: [CartLine]

    init(lines: [CartLine] = []) {
        self.lines = lines
    }

    func quantity(of productId: String) -> Int {
        lines.first { $0.productId == productId }?.quantity ?? 0
    }

    func add(_ productId: String) { lines.add(productId) }
    func remove(_ productId: String) { lines.remove(productId) }
    func clear() { lines = [] }
}
