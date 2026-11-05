import Foundation

/// A reservable time on a date at a restaurant.
nonisolated struct Slot: Equatable, Hashable, Sendable {
    var time: String
    var available: Bool
}

/// Today's availability at a restaurant.
nonisolated enum TodayAvailability: Equatable, Sendable {
    case available, full, closed

    var label: String {
        switch self {
        case .available: Strings.restaurantAvailabilityAvailable
        case .full: Strings.restaurantAvailabilityFull
        case .closed: Strings.restaurantAvailabilityClosed
        }
    }
}

/// The deterministic demonstration availability rule (spec/features/catalog.md), identical on
/// every platform. Pure: the clock is passed in.
nonisolated enum DemoAvailability {
    static let slotIntervalMinutes = 30
    static let lastSeatingBeforeCloseMinutes = 90
    static let minimumNoticeMinutes = 60
    static let bookableDays = 30

    /// 32-bit FNV-1a over the UTF-8 bytes.
    static func fnv1a32(_ text: String) -> UInt32 {
        var hash: UInt32 = 0x811C_9DC5
        for byte in text.utf8 {
            hash ^= UInt32(byte)
            hash = hash &* 0x0100_0193
        }
        return hash
    }

    static func isClosed(_ restaurant: Restaurant, on date: LocalDate) -> Bool {
        restaurant.hours(on: date.weekday) == nil
    }

    /// The day's slots; empty when the restaurant is closed that day.
    static func slots(_ restaurant: Restaurant, on date: LocalDate, now: Date, calendar: Calendar = .local) -> [Slot] {
        guard let hours = restaurant.hours(on: date.weekday),
              let open = TimeOfDay.minutes(hours.open),
              var close = TimeOfDay.minutes(hours.close) else { return [] }
        if close <= open { close += 1440 }
        let last = close - lastSeatingBeforeCloseMinutes
        guard last >= open else { return [] }
        let isToday = date == LocalDate(now, calendar: calendar)
        let earliest = now.addingTimeInterval(TimeInterval(minimumNoticeMinutes * 60))
        var result: [Slot] = []
        for minutes in stride(from: open, through: last, by: slotIntervalMinutes) {
            if isToday && date.date(atMinutes: minutes, calendar: calendar) < earliest { continue }
            let time = TimeOfDay.string(minutes)
            let unavailable = Int(fnv1a32("\(restaurant.id)|\(date.iso)|\(time)") % 100) < restaurant.demandPercent
            result.append(Slot(time: time, available: !unavailable))
        }
        return result
    }

    static func today(_ restaurant: Restaurant, now: Date, calendar: Calendar = .local) -> TodayAvailability {
        let today = LocalDate(now, calendar: calendar)
        if isClosed(restaurant, on: today) { return .closed }
        return slots(restaurant, on: today, now: now, calendar: calendar).contains(where: \.available) ? .available : .full
    }

    /// Today through today + 29 days.
    static func bookableDates(now: Date, calendar: Calendar = .local) -> [LocalDate] {
        let today = LocalDate(now, calendar: calendar)
        return (0..<bookableDays).map { today.adding(days: $0, calendar: calendar) }
    }
}
