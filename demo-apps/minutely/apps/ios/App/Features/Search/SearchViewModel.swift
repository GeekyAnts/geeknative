import Foundation
import Observation

/// State and actions for Search. The query isn't stored: each visit starts empty.
@Observable
final class SearchViewModel {
    enum State: Equatable {
        /// The query is blank.
        case prompt
        case results([Product])
        /// Nothing matched the trimmed query.
        case noResults(query: String)
    }

    @ObservationIgnored private let catalog: any CatalogRepository
    @ObservationIgnored let cart: any CartRepository
    @ObservationIgnored private let router: Router

    var query = ""

    init(catalog: any CatalogRepository, cart: any CartRepository, router: Router) {
        self.catalog = catalog
        self.cart = cart
        self.router = router
    }

    convenience init(container: AppContainer) {
        self.init(catalog: container.catalogRepository, cart: container.cartRepository, router: container.router)
    }

    var state: State {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .prompt }
        let results = catalog.search(trimmed)
        return results.isEmpty ? .noResults(query: trimmed) : .results(results)
    }

    var resultCountText: String? {
        if case .results(let products) = state { return Strings.searchResultCount(count: products.count) }
        return nil
    }

    func clear() { query = "" }

    func openCart() { router.push(.cart) }
}
