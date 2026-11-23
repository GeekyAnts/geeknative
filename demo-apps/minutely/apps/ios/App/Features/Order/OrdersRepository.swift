import Foundation
import Observation

/// Placed orders, newest first.
protocol OrdersRepository: AnyObject {
    var orders: [Order] { get }
    func save(_ order: Order)
    func order(id: String) -> Order?
}

/// Storage key, format and limit, shared with the Android and web apps.
nonisolated enum OrdersStorage {
    static let key = "orders.history"
    static let limit = 20

    static func encode(_ orders: [Order]) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        guard let data = try? encoder.encode(orders) else { return "[]" }
        return String(decoding: data, as: UTF8.self)
    }

    /// Unreadable data counts as no orders.
    static func decode(_ data: Data?) -> [Order] {
        guard let data, let orders = try? JSONDecoder().decode([Order].self, from: data) else { return [] }
        return Array(orders.prefix(limit))
    }

    /// Puts the order first (replacing one with the same id) and keeps the 20 newest.
    static func inserting(_ order: Order, into orders: [Order]) -> [Order] {
        Array(([order] + orders.filter { $0.id != order.id }).prefix(limit))
    }
}

/// Keeps orders in UserDefaults under `orders.history`, as a JSON string.
@Observable
final class UserDefaultsOrdersRepository: OrdersRepository {
    private(set) var orders: [Order]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        let stored = defaults.string(forKey: OrdersStorage.key).map { Data($0.utf8) } ?? defaults.data(forKey: OrdersStorage.key)
        orders = OrdersStorage.decode(stored)
    }

    func save(_ order: Order) {
        orders = OrdersStorage.inserting(order, into: orders)
        defaults.set(OrdersStorage.encode(orders), forKey: OrdersStorage.key)
    }

    func order(id: String) -> Order? { orders.first { $0.id == id } }
}

/// Keeps orders in memory, for previews and tests.
@Observable
final class InMemoryOrdersRepository: OrdersRepository {
    private(set) var orders: [Order]

    init(orders: [Order] = []) {
        self.orders = orders
    }

    func save(_ order: Order) {
        orders = OrdersStorage.inserting(order, into: orders)
    }

    func order(id: String) -> Order? { orders.first { $0.id == id } }
}
