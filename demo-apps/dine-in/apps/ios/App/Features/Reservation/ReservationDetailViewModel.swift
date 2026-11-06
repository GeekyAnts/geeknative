import Foundation
import Observation

/// The calendar event for a reservation: 2 hours at the restaurant.
nonisolated struct CalendarEvent: Equatable, Sendable {
    static let durationHours = 2

    let title: String
    let start: Date
    let end: Date
    let location: String
    let notes: String

    init(reservation: Reservation, restaurant: Restaurant) {
        title = Strings.calendarEventTitle(restaurant: restaurant.name)
        start = reservation.startDate
        end = reservation.startDate.addingTimeInterval(TimeInterval(Self.durationHours * 60 * 60))
        location = restaurant.address
        notes = Strings.calendarEventNotes(code: reservation.confirmationCode)
    }
}

/// State and actions for Confirmation and Reservation detail.
@Observable
final class ReservationDetailViewModel {
    let reservationId: String
    private(set) var catalog: Catalog?
    private(set) var failed = false
    private(set) var isCancelling = false
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession, reservationId: String) {
        self.session = session
        self.reservationId = reservationId
    }

    func load() async {
        if catalog != nil { return }
        failed = false
        do {
            catalog = try await session.catalogRepository.load()
        } catch {
            failed = true
        }
    }

    var isLoading: Bool { catalog == nil && !failed }

    var reservation: Reservation? { session.reservationsRepository.get(reservationId) }

    var restaurant: Restaurant? {
        guard let reservation else { return nil }
        return catalog?.restaurant(reservation.restaurantId)
    }

    var phase: ReservationPhase? { reservation?.phase(now: session.now()) }

    var calendarEvent: CalendarEvent? {
        guard let reservation, let restaurant else { return nil }
        return CalendarEvent(reservation: reservation, restaurant: restaurant)
    }

    var cancelMessage: String {
        guard let reservation else { return "" }
        return Strings.cancelBody(
            restaurant: restaurant?.name ?? reservation.restaurantId,
            date: Formatters.dateShort(iso: reservation.date),
            time: Formatters.time(reservation.time)
        )
    }

    func cancel() async -> Bool {
        guard !isCancelling, reservation?.isUpcoming(now: session.now()) == true else { return false }
        isCancelling = true
        defer { isCancelling = false }
        do {
            _ = try await session.reservationsRepository.cancel(reservationId)
            return true
        } catch {
            return false
        }
    }
}
