import Foundation
import Testing
@testable import App

@MainActor
@Suite("Cart")
struct CartTests {
    let catalog = LocalCatalogRepository()

    private func summary(_ lines: [CartLine]) -> CartSummary {
        var products: [String: Product] = [:]
        for line in lines { products[line.productId] = catalog.product(id: line.productId) }
        return CartSummary(lines: lines, products: products, freeDeliveryThreshold: 199, deliveryFee: 25)
    }

    @Test("AC-cart-1: add appends with quantity 1 or increases; remove decreases and drops the line at 0")
    func addAndRemove() {
        for cart in [InMemoryCartRepository(), UserDefaultsCartRepository(defaults: freshDefaults(), catalog: catalog)] as [any CartRepository] {
            cart.add("banana")
            cart.add("milk")
            cart.add("banana")
            #expect(cart.lines == [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])

            cart.remove("banana")
            #expect(cart.quantity(of: "banana") == 1)
            cart.remove("banana")
            #expect(cart.quantity(of: "banana") == 0)
            #expect(cart.lines == [CartLine(productId: "milk", quantity: 1)])

            cart.remove("eggs") // not in the cart: nothing happens
            #expect(cart.lines == [CartLine(productId: "milk", quantity: 1)])

            cart.clear()
            #expect(cart.lines.isEmpty)
        }
    }

    @Test("AC-cart-2: the cart survives a restart, stored under cart.items as JSON")
    func survivesRestart() throws {
        let defaults = freshDefaults()
        let cart = UserDefaultsCartRepository(defaults: defaults, catalog: catalog)
        cart.add("banana")
        cart.add("banana")
        cart.add("milk")

        let stored = try #require(defaults.string(forKey: "cart.items"))
        #expect(stored == #"[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1}]"#)

        let restarted = UserDefaultsCartRepository(defaults: defaults, catalog: catalog)
        #expect(restarted.lines == cart.lines)
    }

    @Test("AC-cart-2: unknown products, quantities below 1 and unreadable data are dropped")
    func dropsBadData() {
        let defaults = freshDefaults()
        defaults.set(
            #"[{"productId":"banana","quantity":2},{"productId":"unicorn","quantity":1},{"productId":"milk","quantity":0},{"productId":"eggs","quantity":-3},{"productId":"bread","quantity":1}]"#,
            forKey: "cart.items"
        )
        #expect(UserDefaultsCartRepository(defaults: defaults, catalog: catalog).lines == [
            CartLine(productId: "banana", quantity: 2), CartLine(productId: "bread", quantity: 1),
        ])

        defaults.set("not json", forKey: "cart.items")
        #expect(UserDefaultsCartRepository(defaults: defaults, catalog: catalog).lines.isEmpty)

        defaults.set(#"{"productId":"banana"}"#, forKey: "cart.items")
        #expect(UserDefaultsCartRepository(defaults: defaults, catalog: catalog).lines.isEmpty)
    }

    @Test("AC-cart-2: duplicate lines for one product are merged by adding quantities")
    func mergesDuplicates() {
        let defaults = freshDefaults()
        defaults.set(
            #"[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1},{"productId":"banana","quantity":1}]"#,
            forKey: "cart.items"
        )
        #expect(UserDefaultsCartRepository(defaults: defaults, catalog: catalog).lines == [
            CartLine(productId: "banana", quantity: 3), CartLine(productId: "milk", quantity: 1),
        ])

        // Invalid lines are dropped before merging, so they add nothing and don't fix a line's position.
        defaults.set(
            #"[{"productId":"milk","quantity":0},{"productId":"bread","quantity":1},{"productId":"milk","quantity":2},{"productId":"unicorn","quantity":4},{"productId":"milk","quantity":1}]"#,
            forKey: "cart.items"
        )
        #expect(UserDefaultsCartRepository(defaults: defaults, catalog: catalog).lines == [
            CartLine(productId: "bread", quantity: 1), CartLine(productId: "milk", quantity: 3),
        ])
    }

    @Test("AC-cart-3: itemCount, itemTotal, mrpTotal and savings follow the rules (worked example)")
    func totals() {
        let result = summary([CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])
        #expect(result.itemCount == 3)
        #expect(result.itemTotal == 126)
        #expect(result.mrpTotal == 148)
        #expect(result.savings == 22)
    }

    @Test("AC-cart-4: delivery costs the fee below the threshold and is free at or above it")
    func delivery() {
        let below = summary([CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])
        #expect(below.deliveryFee == 25)
        #expect(below.toPay == 151)
        #expect(below.amountToFreeDelivery == 73)

        let above = summary([
            CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1), CartLine(productId: "detergent", quantity: 1),
        ])
        #expect(above.itemTotal == 325)
        #expect(above.deliveryFee == 0)
        #expect(above.toPay == 325)
        #expect(above.amountToFreeDelivery == 0)

        // Exactly at the threshold is free; an empty cart has no fee.
        let exactly = summary([CartLine(productId: "detergent", quantity: 1)])
        #expect(exactly.itemTotal == 199)
        #expect(exactly.deliveryFee == 0)
        let empty = summary([])
        #expect(empty.deliveryFee == 0)
        #expect(empty.toPay == 0)
        #expect(empty.amountToFreeDelivery == 199)

        // The defaults come from contracts/config.json.
        #expect(AppConfig.freeDeliveryThreshold == 199)
        #expect(AppConfig.deliveryFee == 25)
    }

    @Test("AC-cart-5: the cart bar shows only when the cart has items, with count and total, and opens Cart")
    func cartBar() {
        let container = AppContainer.preview()
        #expect(!container.cartSummary.showsCartBar)

        container.cartRepository.add("banana")
        container.cartRepository.add("banana")
        let summary = container.cartSummary
        #expect(summary.showsCartBar)
        #expect(summary.itemCount == 2)
        #expect(summary.itemTotal == 98)

        let home = HomeViewModel(container: container)
        home.openCart()
        #expect(container.router.path == [.cart])

        let search = SearchViewModel(container: container)
        search.openCart()
        let category = CategoryViewModel(categoryId: "fruits", container: container)
        category.openCart()
        #expect(container.router.path == [.cart, .cart, .cart])
    }

    @Test("AC-cart-6: an empty Cart shows the empty state, and Start shopping returns to Home")
    func emptyCart() {
        let container = AppContainer.preview()
        container.router.path = [.search, .cart]
        let viewModel = CartViewModel(container: container)
        #expect(viewModel.isEmpty)
        #expect(viewModel.rows.isEmpty)
        #expect(!viewModel.canPlaceOrder)
        #expect(viewModel.placeOrder() == nil)

        viewModel.startShopping()
        #expect(container.router.path.isEmpty)
    }

    @Test("AC-cart-6: removing the last line shows the empty state")
    func removingLastLine() {
        let container = AppContainer.preview(cart: [CartLine(productId: "milk", quantity: 1)])
        let viewModel = CartViewModel(container: container)
        #expect(!viewModel.isEmpty)
        viewModel.decrease("milk")
        #expect(viewModel.isEmpty)
    }

    @Test("AC-cart-7: placing an order saves it with the cart's lines and totals, empties the cart and opens Order placed")
    func placeOrder() throws {
        let orders = InMemoryOrdersRepository()
        let cart = InMemoryCartRepository(lines: [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])
        let router = Router(path: [.category(categoryId: "fruits"), .cart])
        let viewModel = CartViewModel(catalog: catalog, cart: cart, orders: orders, router: router, clock: { 1_761_800_123_456 })

        let order = try #require(viewModel.placeOrder())

        #expect(order.id == "MN123456")
        #expect(order.placedAt == 1_761_800_123_456)
        #expect(order.lines.map(\.productId) == ["banana", "milk"])
        #expect(order.lines.map(\.quantity) == [2, 1])
        #expect(order.itemCount == 3)
        #expect(order.itemTotal == 126)
        #expect(order.savings == 22)
        #expect(order.deliveryFee == AppConfig.deliveryFee)
        #expect(order.toPay == 126 + AppConfig.deliveryFee)
        #expect(orders.order(id: "MN123456") == order)
        #expect(cart.lines.isEmpty)
        // Cart is replaced, so Back returns to where the shopper was before Cart.
        #expect(router.path == [.category(categoryId: "fruits"), .orderPlaced(orderId: "MN123456")])

        // A second tap places nothing.
        #expect(viewModel.placeOrder() == nil)
        #expect(orders.orders.count == 1)
    }
}
