import Foundation
import Observation

/// The member card, club stats and the reminders preference.
@Observable
final class ProfileViewModel {
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

    var name: String { session.account.name }
    var email: String { session.account.email }
    var initials: String { session.account.initials }

    var memberSince: String {
        Self.memberSince(createdAt: session.account.createdAt)
    }

    static func memberSince(createdAt: String, calendar: Calendar = .local) -> String {
        guard let date = Timestamp.date(createdAt) else { return "" }
        return Strings.profileMemberSince(date: Formatters.monthYear(LocalDate(date, calendar: calendar)))
    }

    struct Stats: Equatable {
        let upcoming: Int
        let dined: Int
        let saved: Int
    }

    static func stats(reservations: [Reservation], savedIds: [String], catalog: Catalog, now: Date) -> Stats {
        let phases = reservations.map { $0.phase(now: now) }
        return Stats(
            upcoming: phases.filter { $0 == .upcoming }.count,
            dined: phases.filter { $0 == .past }.count,
            saved: SavedViewModel.restaurants(ids: savedIds, in: catalog).count
        )
    }

    var stats: Stats? {
        guard let catalog = state.value else { return nil }
        return Self.stats(
            reservations: session.reservationsRepository.reservations,
            savedIds: session.savedRepository.savedIds,
            catalog: catalog,
            now: session.now()
        )
    }

    var reminders: Bool { session.preferencesRepository.preferences.reminders }

    func setReminders(_ on: Bool) {
        var preferences = session.preferencesRepository.preferences
        preferences.reminders = on
        session.preferencesRepository.save(preferences)
    }

    var versionText: String {
        Strings.settingsAboutVersion(version: AppIdentity.version, build: AppIdentity.build)
    }
}
