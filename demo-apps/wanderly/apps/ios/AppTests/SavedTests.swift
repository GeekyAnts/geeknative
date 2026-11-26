import Foundation
import Testing
@testable import App

@Suite("Saved")
struct SavedTests {
    @Test("AC-saved-1: Saved lists destinations and places the traveler has saved, with photographs")
    func listsSaved() {
        let saved = InMemorySavedRepository(items: [
            SavedItem(id: "bali", kind: .destination),
            SavedItem(id: "paris-eiffel", kind: .attraction),
        ])
        let viewModel = SavedViewModel(
            catalogRepository: InMemoryCatalogRepository.bundled(),
            savedRepository: saved,
            navigation: AppNavigation()
        )
        #expect(viewModel.destinations.map(\.id) == ["bali"])
        #expect(viewModel.destinations.first?.imageUrl.isEmpty == false)
        #expect(viewModel.places.map(\.id) == ["paris-eiffel"])
        #expect(viewModel.places.first?.imageUrl.isEmpty == false)
        #expect(!viewModel.isEmpty)
    }

    @Test("AC-saved-2: Unsaving from this screen removes the item from the list and from storage")
    func unsave() {
        withFreshDefaults { defaults in
            let repository = UserDefaultsSavedRepository(defaults: defaults)
            repository.toggle(id: "bali", kind: .destination)
            let viewModel = SavedViewModel(
                catalogRepository: InMemoryCatalogRepository.bundled(),
                savedRepository: repository,
                navigation: AppNavigation()
            )
            viewModel.unsave(id: "bali")
            #expect(viewModel.isEmpty)
            #expect(UserDefaultsSavedRepository(defaults: defaults).items.isEmpty)
        }
    }

    @Test("AC-saved-3: When nothing is saved, the empty state is shown")
    func emptyState() {
        let viewModel = SavedViewModel(
            catalogRepository: InMemoryCatalogRepository.bundled(),
            savedRepository: InMemorySavedRepository(),
            navigation: AppNavigation()
        )
        #expect(viewModel.isEmpty)
        #expect(!Strings.savedEmptyTitle.isEmpty)
    }

    @Test("AC-saved-5: Saved items are still listed after an app restart")
    func survivesRestart() {
        withFreshDefaults { defaults in
            UserDefaultsSavedRepository(defaults: defaults).toggle(id: "bali", kind: .destination)
            let relaunched = UserDefaultsSavedRepository(defaults: defaults)
            #expect(relaunched.items.contains { $0.id == "bali" && $0.kind == .destination })
        }
    }

    @Test("missing or invalid saved storage is an empty list")
    func invalidStorage() {
        withFreshDefaults { defaults in
            defaults.set("not-json", forKey: SavedStorage.key)
            #expect(UserDefaultsSavedRepository(defaults: defaults).items.isEmpty)
        }
    }

    private func withFreshDefaults(_ body: (UserDefaults) -> Void) {
        let name = "SavedTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        body(defaults)
    }
}
