import Testing
@testable import App

@MainActor
@Suite("Search")
struct SearchTests {
    let catalog = LocalCatalogRepository()

    private func makeViewModel(cart: any CartRepository = InMemoryCartRepository()) -> SearchViewModel {
        SearchViewModel(catalog: catalog, cart: cart, router: Router())
    }

    @Test("AC-search-1: a blank or whitespace-only query shows the prompt and no results")
    func blankQuery() {
        let viewModel = makeViewModel()
        #expect(viewModel.state == .prompt)
        viewModel.query = "   \n "
        #expect(viewModel.state == .prompt)
        #expect(viewModel.resultCountText == nil)
        #expect(catalog.search("  ").isEmpty)
    }

    @Test("AC-search-2: results follow the matching rule, case-insensitively, in catalog order")
    func matchingRule() {
        #expect(catalog.search("MILK").map(\.id) == ["milk"])
        #expect(catalog.search("choco").map(\.id) == ["cookies", "chocolate"])
        #expect(catalog.search("fruit").map(\.id) == ["banana", "apple", "tomato", "avocado", "carrot"])
        #expect(catalog.search("salted chips").map(\.id) == ["chips"])
        #expect(catalog.search("xyz").isEmpty)
        #expect(catalog.search("  Salted   CHIPS ").map(\.id) == ["chips"])
    }

    @Test("AC-search-3: no matches shows the no-results state, naming the trimmed query")
    func noResults() {
        let viewModel = makeViewModel()
        viewModel.query = "  xyz "
        #expect(viewModel.state == .noResults(query: "xyz"))
        #expect(Strings.searchNoResultsTitle(query: "xyz").contains("xyz"))
    }

    @Test("AC-search-4: results show the count, and Add puts products in the cart")
    func resultsAndAdd() {
        let cart = InMemoryCartRepository()
        let viewModel = makeViewModel(cart: cart)
        viewModel.query = "choco"
        guard case .results(let products) = viewModel.state else {
            Issue.record("Expected results")
            return
        }
        #expect(products.map(\.id) == ["cookies", "chocolate"])
        #expect(viewModel.resultCountText == Strings.searchResultCount(count: 2))
        #expect(viewModel.resultCountText?.contains("2") == true)

        viewModel.cart.add(products[1].id)
        #expect(cart.quantity(of: "chocolate") == 1)
    }
}
