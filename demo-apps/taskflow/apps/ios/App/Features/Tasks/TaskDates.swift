import Foundation

/// Due dates are calendar dates (`YYYY-MM-DD`), always read and written in the local calendar,
/// never as UTC midnight, so a task is due on the same day in every time zone.
nonisolated enum TaskDates {
    /// The start of that day in `calendar`'s time zone, or nil if `value` isn't a valid `YYYY-MM-DD`.
    static func parseDay(_ value: String, calendar: Calendar = .current) -> Date? {
        let parts = value.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]) else { return nil }
        let components = DateComponents(year: year, month: month, day: day)
        guard let date = calendar.date(from: components) else { return nil }
        let check = calendar.dateComponents([.year, .month, .day], from: date)
        guard check.year == year, check.month == month, check.day == day else { return nil }
        return date
    }

    /// `date`'s local calendar day as `YYYY-MM-DD`.
    static func dayString(_ date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func adding(days: Int, to date: Date, calendar: Calendar = .current) -> Date {
        calendar.date(byAdding: .day, value: days, to: date) ?? date
    }

    /// Not Done, and due before today's local date.
    static func isOverdue(dueDate: String?, status: TaskStatus, today: Date, calendar: Calendar = .current) -> Bool {
        guard status != .done, let dueDate, parseDay(dueDate, calendar: calendar) != nil else { return false }
        // Both are zero-padded YYYY-MM-DD, so string order is date order.
        return dueDate < dayString(today, calendar: calendar)
    }

    /// An ISO 8601 timestamp, with or without fractional seconds.
    static func parseTimestamp(_ value: String) -> Date? {
        if let date = try? Date(value, strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)) {
            return date
        }
        return try? Date(value, strategy: Date.ISO8601FormatStyle())
    }

    static func timestamp(_ date: Date) -> String {
        date.formatted(Date.ISO8601FormatStyle(includingFractionalSeconds: true))
    }

    /// The locale's medium date style, for example "Nov 19, 2026".
    static func mediumDay(_ value: String) -> String? {
        parseDay(value).map { $0.formatted(date: .abbreviated, time: .omitted) }
    }

    /// The locale's long date style, for example "November 19, 2026".
    static func longDay(_ value: String) -> String? {
        parseDay(value).map { $0.formatted(date: .long, time: .omitted) }
    }

    /// Medium date and short time, for example "Nov 18, 2026 at 3:00 PM".
    static func dateTime(_ value: String) -> String {
        parseTimestamp(value).map { $0.formatted(date: .abbreviated, time: .shortened) } ?? value
    }
}
