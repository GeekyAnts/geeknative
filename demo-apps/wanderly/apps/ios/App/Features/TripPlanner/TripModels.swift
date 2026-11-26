import Foundation

nonisolated enum TripStatus: String, Codable, Sendable, Equatable {
    case draft
    case upcoming
    case past
}

nonisolated enum TripSegment: String, CaseIterable, Identifiable, Sendable {
    case upcoming
    case past
    case drafts

    var id: String { rawValue }

    var label: String {
        switch self {
        case .upcoming: Strings.tripsUpcoming
        case .past: Strings.tripsPast
        case .drafts: Strings.tripsDrafts
        }
    }

    var testID: String {
        switch self {
        case .upcoming: "trips.segment.upcoming"
        case .past: "trips.segment.past"
        case .drafts: "trips.segment.drafts"
        }
    }
}

nonisolated struct TripItem: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var placeId: String
    var startTime: String
    var durationMinutes: Int
    var completed: Bool
}

nonisolated struct TripDay: Codable, Equatable, Identifiable, Sendable {
    var dayIndex: Int
    var date: String
    var items: [TripItem]

    var id: Int { dayIndex }
}

nonisolated struct Trip: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var destinationId: String
    var title: String
    var startDate: String
    var endDate: String
    var travelers: Int
    var budgetBand: BudgetBand
    var interests: [String]
    var status: TripStatus
    var days: [TripDay]
}

nonisolated struct BudgetBreakdown: Equatable, Sendable {
    var lodging: Int
    var food: Int
    var activities: Int
    var total: Int
    var symbol: String

    static func compute(destination: Destination, band: BudgetBand, days: Int, travelers: Int) -> BudgetBreakdown {
        let estimates = destination.budgetEstimates.estimate(for: band)
        let lodging = estimates.lodging * days
        let food = estimates.food * days * travelers
        let activities = estimates.activities * days * travelers
        return BudgetBreakdown(
            lodging: lodging,
            food: food,
            activities: activities,
            total: lodging + food + activities,
            symbol: destination.currencySymbol
        )
    }
}

enum TripDates {
    static func today(_ calendar: Calendar = .current) -> String {
        string(from: Date(), calendar: calendar)
    }

    static func string(from date: Date, calendar: Calendar = .current) -> String {
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        let year = components.year ?? 0
        let month = components.month ?? 0
        let day = components.day ?? 0
        return String(format: "%04d-%02d-%02d", year, month, day)
    }

    static func date(from string: String, calendar: Calendar = .current) -> Date? {
        let parts = string.split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2]) else { return nil }
        return calendar.date(from: DateComponents(year: year, month: month, day: day))
    }

    static func addDays(_ string: String, _ days: Int, calendar: Calendar = .current) -> String? {
        guard let date = date(from: string, calendar: calendar),
              let next = calendar.date(byAdding: .day, value: days, to: date) else { return nil }
        return self.string(from: next, calendar: calendar)
    }

    static func daysInclusive(from: String, to: String, calendar: Calendar = .current) -> Int? {
        guard let start = date(from: from, calendar: calendar),
              let end = date(from: to, calendar: calendar) else { return nil }
        let days = calendar.dateComponents([.day], from: start, to: end).day ?? 0
        return days + 1
    }
}

enum TripClassification {
    /// Evaluates on read using local calendar today `YYYY-MM-DD`.
    static func segment(for trip: Trip, today: String) -> TripSegment {
        if trip.status == .draft { return .drafts }
        if trip.endDate < today { return .past }
        return .upcoming
    }

    static func rewrittenStatus(for trip: Trip, today: String) -> TripStatus {
        if trip.status == .draft { return .draft }
        if trip.endDate < today { return .past }
        return trip.status == .past ? .past : .upcoming
    }
}
