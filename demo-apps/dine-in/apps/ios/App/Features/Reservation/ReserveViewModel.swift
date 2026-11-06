import Foundation
import Observation

/// State and actions for the three-step Reserve flow (new, book again and modify).
@Observable
final class ReserveViewModel {
    /// `reserve.time.<HH:mm>`, keeping the colon.
    nonisolated static func timeTestID(_ time: String) -> String {
        ["reserve", "time", time].joined(separator: ".")
    }

    enum State {
        case loading
        case failed
        case restaurantNotFound
        case reservationNotFound
        case ready(Restaurant)
    }

    enum Step: Int, CaseIterable, Comparable {
        case details, preferences, review

        var label: String {
            switch self {
            case .details: Strings.reserveStepDetails
            case .preferences: Strings.reserveStepPreferences
            case .review: Strings.reserveStepReview
            }
        }

        static func < (lhs: Step, rhs: Step) -> Bool { lhs.rawValue < rhs.rawValue }
    }

    let restaurantId: String
    let reservationId: String?
    let rebookFromId: String?
    private(set) var state: State = .loading
    private(set) var step: Step = .details
    /// Whether the last step change moved forward (for the slide direction).
    private(set) var movedForward = true
    private(set) var editing: Reservation?

    private(set) var partySize = 2
    private(set) var date: LocalDate
    private(set) var time: String?
    var seating: Seating = .indoor
    var occasion: Occasion = .none
    private(set) var dietary: Set<Dietary> = []
    var notes = ""

    private(set) var detailsError: String?
    private(set) var saveError: String?
    private(set) var isSaving = false
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession, restaurantId: String, reservationId: String? = nil, rebookFromId: String? = nil) {
        self.session = session
        self.restaurantId = restaurantId
        self.reservationId = reservationId
        self.rebookFromId = rebookFromId
        date = LocalDate(session.now())
    }

    var isModifying: Bool { reservationId != nil }

    var restaurant: Restaurant? {
        if case .ready(let restaurant) = state { return restaurant }
        return nil
    }

    // MARK: - Loading and defaults

    func load() async {
        if restaurant != nil { return }
        state = .loading
        let catalog: Catalog
        do {
            catalog = try await session.catalogRepository.load()
        } catch {
            state = .failed
            return
        }
        guard let restaurant = catalog.restaurant(restaurantId) else {
            state = .restaurantNotFound
            return
        }
        let now = session.now()
        let preferences = session.preferencesRepository.preferences
        if let reservationId {
            guard let reservation = session.reservationsRepository.get(reservationId), reservation.isUpcoming(now: now) else {
                state = .reservationNotFound
                return
            }
            editing = reservation
            partySize = reservation.partySize
            date = LocalDate(iso: reservation.date) ?? LocalDate(now)
            time = reservation.time
            seating = reservation.seating
            occasion = reservation.occasion
            dietary = Set(reservation.dietary)
            notes = reservation.notes
        } else {
            partySize = Self.clamp(preferences.partySize, to: restaurant)
            seating = restaurant.seating.contains(preferences.seating) ? preferences.seating : (restaurant.seating.first ?? .indoor)
            dietary = Set(preferences.dietary)
            if let rebookFromId, let old = session.reservationsRepository.get(rebookFromId) {
                partySize = Self.clamp(old.partySize, to: restaurant)
                if restaurant.seating.contains(old.seating) { seating = old.seating }
            }
            date = LocalDate(now)
            time = nil
            occasion = .none
            notes = ""
        }
        state = .ready(restaurant)
    }

    private static func clamp(_ size: Int, to restaurant: Restaurant) -> Int {
        min(max(size, 1), max(restaurant.maxPartySize, 1))
    }

    // MARK: - Step 1

    var maxPartySize: Int { restaurant?.maxPartySize ?? 1 }
    var canAddGuest: Bool { partySize < maxPartySize }
    var canRemoveGuest: Bool { partySize > 1 }
    var isAtMaxParty: Bool { partySize >= maxPartySize }

    func addGuest() {
        if canAddGuest { partySize += 1 }
    }

    func removeGuest() {
        if canRemoveGuest { partySize -= 1 }
    }

    var dates: [LocalDate] { DemoAvailability.bookableDates(now: session.now()) }

    var today: LocalDate { LocalDate(session.now()) }

    func isClosed(_ day: LocalDate) -> Bool {
        guard let restaurant else { return false }
        return DemoAvailability.isClosed(restaurant, on: day)
    }

    /// The selected date's slots. When modifying, the reservation's own slot shows as available.
    var slots: [Slot] {
        guard let restaurant else { return [] }
        let slots = DemoAvailability.slots(restaurant, on: date, now: session.now())
        guard let editing, editing.restaurantId == restaurant.id, editing.date == date.iso else { return slots }
        return slots.map { $0.time == editing.time ? Slot(time: $0.time, available: true) : $0 }
    }

    var isClosedDay: Bool { isClosed(date) }
    var hasAvailableSlots: Bool { slots.contains(where: \.available) }

    /// Changing the date clears the time if it isn't available on the new date.
    func selectDate(_ day: LocalDate) {
        date = day
        if let time, !slots.contains(where: { $0.time == time && $0.available }) {
            self.time = nil
        }
    }

    func selectTime(_ value: String) {
        guard slots.contains(where: { $0.time == value && $0.available }) else { return }
        time = value
        detailsError = nil
    }

    /// Continue from step 1 requires a time.
    func continueFromDetails() {
        guard time != nil else {
            detailsError = ReservationError.selectTime.message
            return
        }
        detailsError = nil
        go(to: .preferences)
    }

    // MARK: - Step 2

    func toggleDietary(_ value: Dietary) {
        if dietary.contains(value) { dietary.remove(value) } else { dietary.insert(value) }
    }

    var orderedDietary: [Dietary] { Dietary.ordered(dietary) }

    var notesTooLong: Bool { notes.count > ReservationValidator.maxNotesLength }

    func continueFromPreferences() {
        guard !notesTooLong else { return }
        go(to: .review)
    }

    // MARK: - Steps

    /// Tapping a completed step (or an Edit link) goes back to it.
    func goBack(to target: Step) {
        guard target < step else { return }
        go(to: target)
    }

    private func go(to target: Step) {
        movedForward = target > step
        step = target
        saveError = nil
    }

    var draft: ReservationDraft {
        ReservationDraft(
            restaurantId: restaurantId,
            date: date.iso,
            time: time,
            partySize: partySize,
            seating: seating,
            occasion: occasion,
            dietary: orderedDietary,
            notes: notes
        )
    }

    // MARK: - Saving

    /// Validates and saves. Returns the saved reservation, or nil with `saveError` set.
    func save() async -> Reservation? {
        guard !isSaving, let restaurant else { return nil }
        isSaving = true
        saveError = nil
        defer { isSaving = false }
        let repository = session.reservationsRepository
        do {
            try ReservationValidator.validate(draft, restaurant: restaurant, existing: repository.reservations, editing: editing, now: session.now())
            if let editing {
                return try await repository.update(editing.id, draft)
            }
            return try await repository.create(draft)
        } catch let error as ReservationError {
            saveError = error.message
            switch error {
            case .slotTaken:
                time = nil
                go(to: .details)
                detailsError = error.message
            case .selectTime:
                go(to: .details)
                detailsError = error.message
            default:
                break
            }
            return nil
        } catch {
            saveError = ReservationError.generic.message
            return nil
        }
    }
}
