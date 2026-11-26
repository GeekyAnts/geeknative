import Observation

/// State and actions for the Category screen.
@Observable
final class CategoryViewModel {
    @ObservationIgnored private let catalog: any CatalogRepository
    @ObservationIgnored let cart: any CartRepository
    @ObservationIgnored private let router: Router

    let categories: [Category]
    /// The chosen category. An unknown id shows the first category.
    private(set) var selectedCategoryId: String

    init(categoryId: String, catalog: any CatalogRepository, cart: any CartRepository, router: Router) {
        self.catalog = catalog
        self.cart = cart
        self.router = router
        categories = catalog.categories()
        selectedCategoryId = categories.contains { $0.id == categoryId } ? categoryId : (categories.first?.id ?? categoryId)
    }

    convenience init(categoryId: String, container: AppContainer) {
        self.init(categoryId: categoryId, catalog: container.catalogRepository, cart: container.cartRepository, router: container.router)
    }

    var selectedCategory: Category? { categories.first { $0.id == selectedCategoryId } }

    var title: String { selectedCategory?.name ?? "" }

    var products: [Product] { catalog.products(categoryId: selectedCategoryId) }

    /// Switches the screen to another category without pushing a new screen.
    func select(_ categoryId: String) {
        guard categories.contains(where: { $0.id == categoryId }) else { return }
        selectedCategoryId = categoryId
    }

    func openCart() { router.push(.cart) }
}
