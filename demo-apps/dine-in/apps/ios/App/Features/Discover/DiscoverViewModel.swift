import Foundation
import Observation

/// Combines the catalog, the member, saved IDs, reservations, preferences and the clock.
@Observable
final class DiscoverViewModel {
    static let spotlightRestaurantId = "koyo"
    static let spotlightSentences = 2

    private(set) var state: LoadState<Catalog> = .loading
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession) {
        self.session = session
    }

    func load() async {
        if state.value != nil { return }
        state = .loading
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

    var greeting: String {
        Strings.discoverGreetingName(greeting: Self.timeOfDayGreeting(session.now()), name: session.account.firstName)
    }

    var initials: String { session.account.initials }

    /// Morning 05:00–11:59, afternoon 12:00–16:59, evening otherwise.
    static func timeOfDayGreeting(_ date: Date, calendar: Calendar = .local) -> String {
        let hour = calendar.component(.hour, from: date)
        switch hour {
        case 5..<12: return Strings.discoverGreetingMorning
        case 12..<17: return Strings.discoverGreetingAfternoon
        default: return Strings.discoverGreetingEvening
        }
    }

    /// The soonest upcoming reservation, if any.
    var nextReservation: Reservation? {
        let now = session.now()
        return session.reservationsRepository.reservations
            .filter { $0.isUpcoming(now: now) }
            .min { $0.startDate < $1.startDate }
    }

    var hasReminders: Bool {
        !Reminders.list(session.reservationsRepository.reservations, preferences: session.preferencesRepository.preferences, now: session.now()).isEmpty
    }

    func featured(_ catalog: Catalog) -> [Restaurant] {
        catalog.restaurants.filter(\.featured)
    }

    /// Restaurants whose cuisine is among the favourites, sorted by rating.
    func recommended(_ catalog: Catalog) -> [Restaurant] {
        let favourites = Set(session.preferencesRepository.preferences.cuisines)
        guard !favourites.isEmpty else { return [] }
        let matching = catalog.restaurants.filter { favourites.contains($0.cuisine) }
        return ExploreSort.rating.sorted(matching)
    }

    func spotlight(_ catalog: Catalog) -> Restaurant? {
        catalog.restaurant(Self.spotlightRestaurantId)
    }

    func availability(_ restaurant: Restaurant) -> TodayAvailability {
        DemoAvailability.today(restaurant, now: session.now())
    }

    /// The first `count` sentences of a text.
    static func firstSentences(_ text: String, count: Int = spotlightSentences) -> String {
        let sentences = text.matches(of: /[^.!?]+[.!?]+/).map { String($0.output).trimmingCharacters(in: .whitespaces) }
        guard !sentences.isEmpty else { return text }
        return sentences.prefix(count).joined(separator: " ")
    }
}
