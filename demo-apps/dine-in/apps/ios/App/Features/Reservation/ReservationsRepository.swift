import Foundation
import Observation

/// The member's reservations. Observable, so every screen updates after a write.
protocol ReservationsRepository: AnyObject {
    /// Newest `createdAt` first.
    var reservations: [Reservation] { get }
    func list() -> [Reservation]
    func get(_ id: String) -> Reservation?
    func create(_ draft: ReservationDraft) async throws -> Reservation
    func update(_ id: String, _ draft: ReservationDraft) async throws -> Reservation
    func cancel(_ id: String) async throws -> Reservation
}

nonisolated enum ReservationsStorage {
    static func key(for email: String) -> String { "reservations.\(email.lowercased())" }
}

/// The rules shared by every implementation. Writes run on the main actor without suspending
/// between the duplicate checks and the write, so they're serialized.
@Observable
class BaseReservationsRepository: ReservationsRepository {
    private(set) var reservations: [Reservation]
    @ObservationIgnored let now: () -> Date

    init(reservations: [Reservation], now: @escaping () -> Date) {
        self.reservations = reservations
        self.now = now
    }

    func list() -> [Reservation] { reservations }

    func get(_ id: String) -> Reservation? {
        reservations.first { $0.id == id }
    }

    func create(_ draft: ReservationDraft) async throws -> Reservation {
        guard let time = draft.time else { throw ReservationError.selectTime }
        try ReservationValidator.checkDuplicates(draft, existing: reservations, editingId: nil, now: now())
        let timestamp = Timestamp.string(now())
        let reservation = Reservation(
            id: UUID().uuidString.lowercased(),
            confirmationCode: ConfirmationCode.make(avoiding: Set(reservations.map(\.confirmationCode))),
            restaurantId: draft.restaurantId,
            date: draft.date,
            time: time,
            partySize: draft.partySize,
            seating: draft.seating,
            occasion: draft.occasion,
            dietary: Dietary.ordered(draft.dietary),
            notes: draft.notes,
            status: .confirmed,
            createdAt: timestamp,
            updatedAt: timestamp
        )
        write([reservation] + reservations)
        return reservation
    }

    func update(_ id: String, _ draft: ReservationDraft) async throws -> Reservation {
        guard let index = reservations.firstIndex(where: { $0.id == id }) else { throw ReservationError.notFound }
        guard let time = draft.time else { throw ReservationError.selectTime }
        try ReservationValidator.checkDuplicates(draft, existing: reservations, editingId: id, now: now())
        var updated = reservations[index]
        updated.restaurantId = draft.restaurantId
        updated.date = draft.date
        updated.time = time
        updated.partySize = draft.partySize
        updated.seating = draft.seating
        updated.occasion = draft.occasion
        updated.dietary = Dietary.ordered(draft.dietary)
        updated.notes = draft.notes
        updated.updatedAt = Timestamp.string(now())
        var all = reservations
        all[index] = updated
        write(all)
        return updated
    }

    func cancel(_ id: String) async throws -> Reservation {
        guard let index = reservations.firstIndex(where: { $0.id == id }) else { throw ReservationError.notFound }
        var cancelled = reservations[index]
        cancelled.status = .cancelled
        cancelled.updatedAt = Timestamp.string(now())
        var all = reservations
        all[index] = cancelled
        write(all)
        return cancelled
    }

    private func write(_ all: [Reservation]) {
        reservations = all.sorted { $0.createdAt > $1.createdAt }
        persist(reservations)
    }

    /// Saves the list. Subclasses store it somewhere.
    func persist(_ reservations: [Reservation]) {}
}

/// Keeps a member's reservations in UserDefaults under `reservations.<email>`.
final class UserDefaultsReservationsRepository: BaseReservationsRepository {
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let key: String

    init(defaults: UserDefaults, email: String, now: @escaping () -> Date = Date.init) {
        self.defaults = defaults
        key = ReservationsStorage.key(for: email)
        let stored = defaults.string(forKey: key)
            .flatMap { try? JSONDecoder().decode([Lossy<Reservation>].self, from: Data($0.utf8)) }?
            .compactMap(\.value) ?? []
        super.init(reservations: stored, now: now)
    }

    override func persist(_ reservations: [Reservation]) {
        let data = (try? JSONEncoder().encode(reservations)) ?? Data("[]".utf8)
        defaults.set(String(decoding: data, as: UTF8.self), forKey: key)
    }
}

/// Keeps reservations in memory, for previews and tests.
final class InMemoryReservationsRepository: BaseReservationsRepository {
    override init(reservations: [Reservation] = [], now: @escaping () -> Date = Date.init) {
        super.init(reservations: reservations.sorted { $0.createdAt > $1.createdAt }, now: now)
    }
}
