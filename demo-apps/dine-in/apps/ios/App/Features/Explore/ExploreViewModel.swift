import Foundation
import Observation

/// Search, filters, sort and the grid or list choice for Explore.
@Observable
final class ExploreViewModel {
    static let searchDebounce: Duration = .milliseconds(200)

    private(set) var state: LoadState<Catalog> = .loading
    /// What's typed in the search field; committed to `filters.query` after the debounce.
    var searchText = ""
    private(set) var filters = ExploreFilters()
    var sort: ExploreSort = .popularity
    private(set) var viewMode: ExploreViewMode
    /// The Filters sheet's working copy; applied only by `applyDraft()`.
    var draft = ExploreFilters()
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession) {
        self.session = session
        viewMode = session.exploreRepository.viewMode
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

    var restaurants: [Restaurant] { state.value?.restaurants ?? [] }

    var results: [Restaurant] {
        filters.apply(to: restaurants, sort: sort, now: session.now())
    }

    /// The featured row shows only with no search text and no filters.
    var showsFeatured: Bool {
        filters.query.trimmingCharacters(in: .whitespaces).isEmpty && !filters.hasActiveFilters
    }

    var featured: [Restaurant] { restaurants.filter(\.featured) }

    var activeFilterCount: Int { filters.activeCount }

    /// Distinct catalog neighbourhoods, sorted alphabetically.
    var neighbourhoods: [String] {
        Array(Set(restaurants.map(\.neighbourhood))).sorted()
    }

    func availability(_ restaurant: Restaurant) -> TodayAvailability {
        DemoAvailability.today(restaurant, now: session.now())
    }

    func commitSearch() {
        filters.query = searchText
    }

    func clearSearch() {
        searchText = ""
        filters.query = ""
    }

    /// Arriving from Discover replaces the current filters with just the requested one.
    func apply(_ request: ExploreRequest) {
        var next = ExploreFilters()
        next.query = request.query ?? ""
        if let cuisine = request.cuisine { next.cuisines = [cuisine] }
        next.collection = request.collection
        filters = next
        searchText = next.query
    }

    func toggleCuisine(_ cuisine: CuisineId) {
        if filters.cuisines.contains(cuisine) { filters.cuisines.remove(cuisine) } else { filters.cuisines.insert(cuisine) }
    }

    func toggleAvailableToday() {
        filters.availableToday.toggle()
    }

    func removeCollection() {
        filters.collection = nil
    }

    func clearFilters() {
        filters = filters.clearingFilters()
    }

    func setViewMode(_ mode: ExploreViewMode) {
        viewMode = mode
        session.exploreRepository.setViewMode(mode)
    }

    // MARK: - Filters sheet

    func beginEditing() {
        draft = filters
    }

    var draftCount: Int {
        draft.apply(to: restaurants, sort: sort, now: session.now()).count
    }

    func applyDraft() {
        var next = draft
        next.query = filters.query
        filters = next
    }

    func clearDraft() {
        draft = draft.clearingFilters()
    }
}
