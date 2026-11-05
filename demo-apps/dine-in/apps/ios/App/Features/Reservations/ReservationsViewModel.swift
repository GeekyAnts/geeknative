import Foundation
import Observation

/// Upcoming, past and cancelled reservations.
@Observable
final class ReservationsViewModel {
    var segment: ReservationsSegment = .upcoming
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

    /// Upcoming soonest first; past and cancelled most recent first (by date-time).
    static func group(_ reservations: [Reservation], now: Date) -> [ReservationsSegment: [Reservation]] {
        var groups: [ReservationsSegment: [Reservation]] = [.upcoming: [], .past: [], .cancelled: []]
        for reservation in reservations {
            switch reservation.phase(now: now) {
            case .upcoming: groups[.upcoming, default: []].append(reservation)
            case .past: groups[.past, default: []].append(reservation)
            case .cancelled: groups[.cancelled, default: []].append(reservation)
            }
        }
        groups[.upcoming]?.sort { $0.startDate < $1.startDate }
        groups[.past]?.sort { $0.startDate > $1.startDate }
        groups[.cancelled]?.sort { $0.startDate > $1.startDate }
        return groups
    }

    var groups: [ReservationsSegment: [Reservation]] {
        Self.group(session.reservationsRepository.reservations, now: session.now())
    }

    func reservations(in segment: ReservationsSegment) -> [Reservation] {
        groups[segment] ?? []
    }

    func restaurant(_ reservation: Reservation) -> Restaurant? {
        state.value?.restaurant(reservation.restaurantId)
    }

    /// What a card offers: upcoming → Modify and Cancel; past and cancelled → Book again.
    enum CardAction: Equatable { case modify, cancel, rebook }

    static func actions(for phase: ReservationPhase) -> [CardAction] {
        phase == .upcoming ? [.modify, .cancel] : [.rebook]
    }

    func cancel(_ reservation: Reservation) async {
        _ = try? await session.reservationsRepository.cancel(reservation.id)
    }
}
