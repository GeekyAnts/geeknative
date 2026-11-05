import Foundation

/// A calendar day in the device's local time, stored as "yyyy-MM-dd".
nonisolated struct LocalDate: Hashable, Comparable, Sendable {
    let year: Int
    let month: Int
    let day: Int

    init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }

    init?(iso: String) {
        let parts = iso.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3, (1...12).contains(parts[1]), (1...31).contains(parts[2]) else { return nil }
        self.init(year: parts[0], month: parts[1], day: parts[2])
    }

    init(_ date: Date, calendar: Calendar = .local) {
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        self.init(year: components.year ?? 1970, month: components.month ?? 1, day: components.day ?? 1)
    }

    var iso: String {
        String(format: "%04d-%02d-%02d", year, month, day)
    }

    /// Midnight at the start of this day.
    func startDate(calendar: Calendar = .local) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day)) ?? .distantPast
    }

    /// The moment `minutes` after this day's midnight (may run into the next day).
    func date(atMinutes minutes: Int, calendar: Calendar = .local) -> Date {
        calendar.date(byAdding: .minute, value: minutes, to: startDate(calendar: calendar)) ?? .distantPast
    }

    func adding(days: Int, calendar: Calendar = .local) -> LocalDate {
        LocalDate(calendar.date(byAdding: .day, value: days, to: startDate(calendar: calendar)) ?? .distantPast, calendar: calendar)
    }

    var weekday: Weekday {
        let value = Calendar.local.component(.weekday, from: startDate())
        // Calendar weekdays start on Sunday (1); ours start on Monday.
        return Weekday(rawValue: (value + 5) % 7) ?? .mon
    }

    static func < (lhs: LocalDate, rhs: LocalDate) -> Bool {
        (lhs.year, lhs.month, lhs.day) < (rhs.year, rhs.month, rhs.day)
    }
}

extension Calendar {
    /// The Gregorian calendar in the device's time zone, used for every date in the app.
    nonisolated static var local: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }
}

/// Times of day as "HH:mm" strings and minutes after midnight.
nonisolated enum TimeOfDay {
    static func minutes(_ time: String) -> Int? {
        let parts = time.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2, (0...24).contains(parts[0]), (0...59).contains(parts[1]) else { return nil }
        return parts[0] * 60 + parts[1]
    }

    /// "HH:mm" for minutes after midnight; times past midnight wrap (1470 → "00:30").
    static func string(_ minutes: Int) -> String {
        let wrapped = ((minutes % 1440) + 1440) % 1440
        return String(format: "%02d:%02d", wrapped / 60, wrapped % 60)
    }
}

/// ISO 8601 timestamps in UTC with a "Z", as stored data uses on every platform.
nonisolated enum Timestamp {
    static func string(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.string(from: date)
    }

    static func date(_ string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: string) { return date }
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: string)
    }
}
