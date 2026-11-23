import Foundation
import Testing
@testable import App

@MainActor
@Suite("Order")
struct OrderTests {
    let catalog = LocalCatalogRepository()

    private func order(at placedAt: Int) -> Order {
        Order.make(lines: [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)], catalog: catalog, placedAt: placedAt)
    }

    @Test("AC-order-1: the id is MN and placedAt % 1000000, zero-padded to 6 digits")
    func orderId() {
        #expect(Order.id(placedAt: 1_761_800_123_456) == "MN123456")
        #expect(Order.id(placedAt: 1_761_800_000_042) == "MN000042")
        #expect(Order.id(placedAt: 1_761_800_000_000) == "MN000000")
        #expect(order(at: 1_761_800_123_456).id == "MN123456")
    }

    @Test("AC-order-2: orders survive a restart under orders.history, newest first")
    func survivesRestart() throws {
        let defaults = freshDefaults()
        let repository = UserDefaultsOrdersRepository(defaults: defaults)
        let first = order(at: 1_761_800_000_001)
        let second = order(at: 1_761_800_000_002)
        repository.save(first)
        repository.save(second)

        let restarted = UserDefaultsOrdersRepository(defaults: defaults)
        #expect(restarted.orders.map(\.id) == ["MN000002", "MN000001"])
        #expect(restarted.order(id: "MN000001") == first)

        // Exactly the spec's field names.
        let json = try #require(defaults.string(forKey: "orders.history"))
        let array = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]])
        #expect(Set(array[0].keys) == ["id", "placedAt", "lines", "itemCount", "itemTotal", "savings", "deliveryFee", "toPay"])
        let line = try #require((array[0]["lines"] as? [[String: Any]])?.first)
        #expect(Set(line.keys) == ["productId", "name", "unit", "emoji", "categoryId", "price", "mrp", "quantity"])
    }

    @Test("AC-order-2: keeps at most the 20 newest, and unreadable data counts as no orders")
    func limitAndBadData() {
        let defaults = freshDefaults()
        let repository = UserDefaultsOrdersRepository(defaults: defaults)
        for index in 1...25 { repository.save(order(at: 1_761_800_000_000 + index)) }
        let restarted = UserDefaultsOrdersRepository(defaults: defaults)
        #expect(restarted.orders.count == 20)
        #expect(restarted.orders.first?.id == "MN000025")
        #expect(restarted.orders.last?.id == "MN000006")

        defaults.set("garbage", forKey: "orders.history")
        #expect(UserDefaultsOrdersRepository(defaults: defaults).orders.isEmpty)
    }

    @Test("AC-order-3: Order placed shows the number, delivery time, each line and the total")
    func showsOrder() throws {
        let placed = order(at: 1_761_800_123_456)
        let viewModel = OrderPlacedViewModel(orderId: placed.id, orders: InMemoryOrdersRepository(orders: [placed]), router: Router())
        let shown = try #require(viewModel.order)
        #expect(viewModel.numberText == Strings.orderNumber(id: "MN123456"))
        #expect(viewModel.numberText.contains("MN123456"))
        #expect(viewModel.deliveryText.contains(String(AppConfig.deliveryMinutes)))
        #expect(shown.lines.map(\.productId) == ["banana", "milk"])
        #expect(shown.lines.map(\.lineTotal) == [98, 28])
        #expect(shown.lines[0].name == "Robusta Banana")
        #expect(viewModel.lineText(shown.lines[0]) == Strings.orderLineQuantity(name: "Robusta Banana", count: 2))
        #expect(viewModel.lineText(shown.lines[0]).contains("Robusta Banana"))
        #expect(viewModel.lineText(shown.lines[0]).contains("2"))
        #expect(shown.lines.map(\.unit) == ["6 pcs", "500 ml"])
        #expect(viewModel.totalText == Strings.commonPrice(amount: 126 + AppConfig.deliveryFee))
        #expect(viewModel.steps.map(\.state) == [.done, .current, .pending, .pending])
    }

    @Test("AC-order-4: an unknown order id shows the not-found state")
    func notFound() {
        let viewModel = OrderPlacedViewModel(orderId: "MN999999", orders: InMemoryOrdersRepository(), router: Router())
        #expect(viewModel.order == nil)
    }

    @Test("AC-order-5: Continue shopping returns to Home")
    func continueShopping() {
        let router = Router(path: [.search, .orderPlaced(orderId: "MN123456")])
        let viewModel = OrderPlacedViewModel(orderId: "MN123456", orders: InMemoryOrdersRepository(), router: router)
        viewModel.continueShopping()
        #expect(router.path.isEmpty)
    }
}
