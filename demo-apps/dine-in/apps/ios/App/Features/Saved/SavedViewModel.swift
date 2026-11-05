import Foundation
import Observation

/// The member's saved restaurants, most recently saved first.
@Observable
final class SavedViewModel {
    private(set) var state: LoadState<Catalog> = .loading
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession) {
        self.session = session
    }

    func load() async {
        if state.value != nil { return }
        do {
            state = .loaded(try await session.catalogRepository.load())
        } catch {
            state = .failed
        }
    }

    func retry() async {
        state = .loading
        await load()
    }

    /// IDs not in the catalog are ignored.
    static func restaurants(ids: [String], in catalog: Catalog) -> [Restaurant] {
        ids.compactMap { catalog.restaurant($0) }
    }

    var restaurants: [Restaurant] {
        guard let catalog = state.value else { return [] }
        return Self.restaurants(ids: session.savedRepository.savedIds, in: catalog)
    }

    func availability(_ restaurant: Restaurant) -> TodayAvailability {
        DemoAvailability.today(restaurant, now: session.now())
    }
}
