import Foundation
import SwiftUI

nonisolated enum Occasion: String, Codable, CaseIterable, Sendable, Identifiable {
    case none, birthday, anniversary, business, date, celebration

    var id: Self { self }

    var label: String {
        switch self {
        case .none: Strings.occasionNone
        case .birthday: Strings.occasionBirthday
        case .anniversary: Strings.occasionAnniversary
        case .business: Strings.occasionBusiness
        case .date: Strings.occasionDate
        case .celebration: Strings.occasionCelebration
        }
    }

    var icon: ImageResource? {
        switch self {
        case .none: nil
        case .birthday: AppIcon.occasionBirthday
        case .anniversary: AppIcon.occasionAnniversary
        case .business: AppIcon.occasionBusiness
        case .date: AppIcon.occasionDate
        case .celebration: AppIcon.occasionCelebration
        }
    }
}

/// In the order listed in PRODUCT.md, which is also the stored order.
nonisolated enum Dietary: String, Codable, CaseIterable, Sendable, Identifiable {
    case vegetarian, vegan, glutenFree, dairyFree, nutAllergy, shellfishAllergy

    var id: Self { self }

    var label: String {
        switch self {
        case .vegetarian: Strings.dietaryVegetarian
        case .vegan: Strings.dietaryVegan
        case .glutenFree: Strings.dietaryGlutenFree
        case .dairyFree: Strings.dietaryDairyFree
        case .nutAllergy: Strings.dietaryNutAllergy
        case .shellfishAllergy: Strings.dietaryShellfishAllergy
        }
    }

    /// Canonical order, without duplicates.
    static func ordered(_ values: some Sequence<Dietary>) -> [Dietary] {
        let set = Set(values)
        return allCases.filter(set.contains)
    }
}

nonisolated enum ReservationStatus: String, Codable, Sendable {
    case confirmed, cancelled
}

/// Upcoming, past or cancelled, relative to the clock.
nonisolated enum ReservationPhase: Equatable, Sendable {
    case upcoming, past, cancelled
}

/// A booking the member made. Stored as JSON under `reservations.<email>` with these field names.
nonisolated struct Reservation: Codable, Equatable, Hashable, Sendable, Identifiable {
    var id: String
    var confirmationCode: String
    var restaurantId: String
    var date: String
    var time: String
    var partySize: Int
    var seating: Seating
    var occasion: Occasion
    var dietary: [Dietary]
    var notes: String
    var status: ReservationStatus
    var createdAt: String
    var updatedAt: String

    /// The reservation's local date and time.
    var startDate: Date {
        guard let day = LocalDate(iso: date), let minutes = TimeOfDay.minutes(time) else { return .distantPast }
        return day.date(atMinutes: minutes)
    }

    func phase(now: Date) -> ReservationPhase {
        if status == .cancelled { return .cancelled }
        return startDate > now ? .upcoming : .past
    }

    func isUpcoming(now: Date) -> Bool { phase(now: now) == .upcoming }

    var draft: ReservationDraft {
        ReservationDraft(restaurantId: restaurantId, date: date, time: time, partySize: partySize, seating: seating, occasion: occasion, dietary: dietary, notes: notes)
    }
}

/// What the member chose in Reserve, before it's saved.
nonisolated struct ReservationDraft: Equatable, Sendable {
    var restaurantId: String
    var date: String
    var time: String?
    var partySize: Int
    var seating: Seating
    var occasion: Occasion
    var dietary: [Dietary]
    var notes: String
}

nonisolated enum ReservationError: Error, Equatable {
    case selectTime, notesTooLong, slotTaken, duplicateTime, duplicateRestaurant, notFound, generic

    var message: String {
        switch self {
        case .selectTime: Strings.reserveErrorSelectTime
        case .notesTooLong: Strings.reserveErrorNotesTooLong(max: ReservationValidator.maxNotesLength)
        case .slotTaken: Strings.reserveErrorSlotTaken
        case .duplicateTime: Strings.reserveErrorDuplicateTime
        case .duplicateRestaurant: Strings.reserveErrorDuplicateRestaurant
        case .notFound, .generic: Strings.reserveErrorGeneric
        }
    }
}

/// The checks run when saving, in the order of spec/features/reservation.md.
nonisolated enum ReservationValidator {
    static let maxNotesLength = 280

    static func validate(_ draft: ReservationDraft, restaurant: Restaurant, existing: [Reservation], editing: Reservation?, now: Date) throws(ReservationError) {
        guard let time = draft.time else { throw .selectTime }
        guard draft.notes.count <= maxNotesLength else { throw .notesTooLong }
        let isOwnSlot = editing.map { $0.restaurantId == draft.restaurantId && $0.date == draft.date && $0.time == time } ?? false
        if !isOwnSlot {
            guard let day = LocalDate(iso: draft.date),
                  DemoAvailability.slots(restaurant, on: day, now: now).contains(where: { $0.time == time && $0.available }) else {
                throw .slotTaken
            }
        }
        try checkDuplicates(draft, existing: existing, editingId: editing?.id, now: now)
    }

    /// Rules 4 and 5: no other upcoming confirmed reservation at the same date and time, or at
    /// the same restaurant on the same date.
    static func checkDuplicates(_ draft: ReservationDraft, existing: [Reservation], editingId: String?, now: Date) throws(ReservationError) {
        let others = existing.filter { $0.id != editingId && $0.isUpcoming(now: now) }
        if others.contains(where: { $0.date == draft.date && $0.time == draft.time }) { throw .duplicateTime }
        if others.contains(where: { $0.restaurantId == draft.restaurantId && $0.date == draft.date }) { throw .duplicateRestaurant }
    }
}

nonisolated enum ConfirmationCode {
    static let alphabet = Array("ABCDEFGHJKMNPQRSTUVWXYZ23456789")
    static let length = 6
    static let prefix = "DC-"

    static func make(avoiding existing: Set<String>) -> String {
        var generator = SystemRandomNumberGenerator()
        return make(avoiding: existing, using: &generator)
    }

    static func make(avoiding existing: Set<String>, using generator: inout some RandomNumberGenerator) -> String {
        while true {
            let code = prefix + String((0..<length).map { _ in alphabet.randomElement(using: &generator)! })
            if !existing.contains(code) { return code }
        }
    }

    static func isValid(_ code: String) -> Bool {
        guard code.hasPrefix(prefix) else { return false }
        let body = code.dropFirst(prefix.count)
        return body.count == length && body.allSatisfy(alphabet.contains)
    }
}
