import Foundation

/// The state of data a screen loads.
enum LoadState<Value> {
    case loading
    case failed
    case loaded(Value)

    var value: Value? {
        if case .loaded(let value) = self { return value }
        return nil
    }
}

/// Reminders: one per upcoming confirmed reservation within the next 7 days, soonest first, and
/// none when the member turned reminders off (spec/features/discover.md).
nonisolated enum Reminders {
    static let windowDays = 7

    static func list(_ reservations: [Reservation], preferences: DiningPreferences, now: Date) -> [Reservation] {
        guard preferences.reminders else { return [] }
        let end = now.addingTimeInterval(TimeInterval(windowDays * 24 * 60 * 60))
        return reservations
            .filter { $0.isUpcoming(now: now) && $0.startDate <= end }
            .sorted { $0.startDate < $1.startDate }
    }
}
