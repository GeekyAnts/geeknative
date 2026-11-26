import Observation

/// State and actions for Home.
@Observable
final class HomeViewModel {
    @ObservationIgnored private let catalog: any CatalogRepository
    @ObservationIgnored let cart: any CartRepository
    @ObservationIgnored private let router: Router

    let categories: [Category]
    let bestsellers: [Product]

    init(catalog: any CatalogRepository, cart: any CartRepository, router: Router) {
        self.catalog = catalog
        self.cart = cart
        self.router = router
        categories = catalog.categories()
        bestsellers = catalog.bestsellers()
    }

    convenience init(container: AppContainer) {
        self.init(catalog: container.catalogRepository, cart: container.cartRepository, router: container.router)
    }

    var title: String { AppIdentity.name }

    var deliveryPromise: String { Strings.commonDeliveryIn(minutes: AppConfig.deliveryMinutes) }

    var deliveryAddress: String { Strings.commonDeliveryAddress }

    var bannerBody: String { Strings.homeBannerBody(amount: AppConfig.freeDeliveryThreshold) }

    var cartSummary: CartSummary { CartSummary(lines: cart.lines, catalog: catalog) }

    /// The Cart button's badge: the item count, or nil when the cart is empty.
    var cartBadge: Int? {
        let count = cartSummary.itemCount
        return count > 0 ? count : nil
    }

    func openCategory(_ categoryId: String) { router.push(.category(categoryId: categoryId)) }
    func openSearch() { router.push(.search) }
    func openCart() { router.push(.cart) }
    func openSettings() { router.push(.settings) }
}
