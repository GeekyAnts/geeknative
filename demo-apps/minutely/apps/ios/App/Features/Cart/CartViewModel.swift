import Observation

/// One cart line with its product, as the Cart screen shows it.
struct CartRow: Identifiable, Equatable {
    let product: Product
    let quantity: Int

    var id: String { product.id }
    var lineTotal: Int { product.price * quantity }
    var lineMrp: Int { product.mrp * quantity }
}

/// State and actions for the Cart screen, including placing an order.
@Observable
final class CartViewModel {
    @ObservationIgnored private let catalog: any CatalogRepository
    @ObservationIgnored let cart: any CartRepository
    @ObservationIgnored private let orders: any OrdersRepository
    @ObservationIgnored private let router: Router
    @ObservationIgnored private let clock: () -> Int

    /// True once Place order is tapped, so a double tap places one order.
    private(set) var isPlacingOrder = false

    init(
        catalog: any CatalogRepository,
        cart: any CartRepository,
        orders: any OrdersRepository,
        router: Router,
        clock: @escaping () -> Int
    ) {
        self.catalog = catalog
        self.cart = cart
        self.orders = orders
        self.router = router
        self.clock = clock
    }

    convenience init(container: AppContainer) {
        self.init(
            catalog: container.catalogRepository,
            cart: container.cartRepository,
            orders: container.ordersRepository,
            router: container.router,
            clock: container.clock
        )
    }

    var rows: [CartRow] {
        cart.lines.compactMap { line in
            catalog.product(id: line.productId).map { CartRow(product: $0, quantity: line.quantity) }
        }
    }

    var summary: CartSummary { CartSummary(lines: cart.lines, catalog: catalog) }

    var isEmpty: Bool { summary.itemCount == 0 }

    var canPlaceOrder: Bool { !isEmpty && !isPlacingOrder }

    func increase(_ productId: String) { cart.add(productId) }
    func decrease(_ productId: String) { cart.remove(productId) }

    /// Saves an order from the cart, empties the cart and replaces Cart with Order placed.
    /// Returns the new order, or nil when there was nothing to place or an order is already being placed.
    @discardableResult
    func placeOrder() -> Order? {
        guard canPlaceOrder else { return nil }
        isPlacingOrder = true
        let order = Order.make(lines: cart.lines, catalog: catalog, placedAt: clock())
        orders.save(order)
        cart.clear()
        router.replaceLast(with: .orderPlaced(orderId: order.id))
        return order
    }

    /// From the empty state, back to Home.
    func startShopping() { router.popToRoot() }
}
