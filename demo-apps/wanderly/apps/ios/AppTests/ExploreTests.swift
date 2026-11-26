import Foundation
import Testing
@testable import App

@Suite("Explore")
struct ExploreTests {
    private func makeViewModel(query: String = "", category: String? = nil) -> ExploreViewModel {
        let container = AppContainer.preview()
        container.navigation.exploreQuery = query
        container.navigation.exploreCategory = category
        return ExploreViewModel(container: container)
    }

    @Test("AC-explore-1: Typing a query shows destinations and places whose names match")
    func queryMatchesNames() {
        let viewModel = makeViewModel(query: "paris")
        #expect(viewModel.destinations.contains { $0.id == "paris" })
        #expect(viewModel.destinations.allSatisfy { $0.name.localizedCaseInsensitiveContains("paris") || $0.country.localizedCaseInsensitiveContains("paris") || $0.tagline.localizedCaseInsensitiveContains("paris") || $0.description.localizedCaseInsensitiveContains("paris") })
        #expect(viewModel.places.contains { $0.name.localizedCaseInsensitiveContains("paris") || $0.id.contains("paris") })
        #expect(!viewModel.destinations.contains { $0.id == "bali" })
    }

    @Test("AC-explore-2: Choosing a category shows only destinations (and places) tagged with that category")
    func categoryFilter() {
        let viewModel = makeViewModel(category: "beaches")
        #expect(!viewModel.destinations.isEmpty)
        #expect(viewModel.destinations.allSatisfy { $0.categories.contains("beaches") })
        #expect(viewModel.places.allSatisfy { $0.category == "beaches" })
        #expect(viewModel.destinations.contains { $0.id == "bali" })
        #expect(!viewModel.destinations.contains { $0.id == "paris" })
    }

    @Test("AC-explore-4: With no query and no category, Explore shows the full destination grid")
    func fullGrid() {
        let viewModel = makeViewModel()
        let catalog = InMemoryCatalogRepository.bundled().catalog
        #expect(viewModel.destinations.map(\.id) == catalog.destinations.map(\.id))
        #expect(!viewModel.destinations.isEmpty)
    }

    @Test("AC-explore-5: A query with no matches shows the empty state")
    func emptyState() {
        let viewModel = makeViewModel(query: "zzzz-not-a-place")
        #expect(viewModel.isEmpty)
        #expect(viewModel.destinations.isEmpty)
        #expect(viewModel.places.isEmpty)
        viewModel.clearFilters()
        #expect(!viewModel.isEmpty)
    }
}
