import Foundation

/// Dates, times, prices and ratings built from contracts/strings rather than platform locale
/// formatters, so all three apps print exactly the same text (spec/features/catalog.md).
nonisolated enum Formatters {
    /// "Fri, 20 Nov"
    static func dateShort(_ date: LocalDate) -> String {
        Strings.formatDateShort(weekday: date.weekday.shortLabel, day: date.day, month: monthShort(date.month))
    }

    static func dateShort(iso: String) -> String {
        LocalDate(iso: iso).map(dateShort) ?? iso
    }

    /// "Friday, 20 November 2026". The year is printed without grouping, which the generated
    /// helper's localized integer formatting would add ("2,026").
    static func dateLong(_ date: LocalDate) -> String {
        plain("format.dateLong", date.weekday.label, date.day, monthLong(date.month), date.year)
    }

    static func dateLong(iso: String) -> String {
        LocalDate(iso: iso).map(dateLong) ?? iso
    }

    /// "November 2026"
    static func monthYear(_ date: LocalDate) -> String {
        plain("format.monthYear", monthLong(date.month), date.year)
    }

    /// "7:30 PM" from "19:30"; "12:00 AM" from "00:00".
    static func time(_ time: String) -> String {
        guard let minutes = TimeOfDay.minutes(time) else { return time }
        let wrapped = minutes % 1440
        let hour24 = wrapped / 60
        let hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12
        let minute = String(format: "%02d", wrapped % 60)
        return Strings.formatTime(hour: hour12, minute: minute, period: hour24 < 12 ? Strings.formatAm : Strings.formatPm)
    }

    /// "7:00 PM – 11:30 PM"
    static func timeRange(_ hours: OpeningHours) -> String {
        Strings.formatTimeRange(start: time(hours.open), end: time(hours.close))
    }

    /// "Fri, 20 Nov · 7:30 PM"
    static func dateAndTime(iso: String, time timeString: String) -> String {
        Strings.formatSeparator(first: dateShort(iso: iso), second: time(timeString))
    }

    /// "Friday, 20 November 2026 · 7:30 PM"
    static func longDateAndTime(iso: String, time timeString: String) -> String {
        Strings.formatSeparator(first: dateLong(iso: iso), second: time(timeString))
    }

    /// "₹2,400", "₹1,25,000"
    static func price(_ amount: Int) -> String {
        Strings.formatPrice(amount: indianGrouped(amount))
    }

    /// "·": the separator text with empty parts, for separating views.
    static var separatorSymbol: String {
        Strings.formatSeparator(first: "", second: "").trimmingCharacters(in: .whitespaces)
    }

    /// "₹": the price text with an empty amount.
    static var priceSymbol: String {
        Strings.formatPrice(amount: "")
    }

    /// Last three digits, then pairs: 2400 → "2,400", 125000 → "1,25,000".
    static func indianGrouped(_ amount: Int) -> String {
        let digits = String(abs(amount))
        let sign = amount < 0 ? "-" : ""
        guard digits.count > 3 else { return sign + digits }
        var head = String(digits.dropLast(3))
        let tail = String(digits.suffix(3))
        var groups: [String] = []
        while head.count > 2 {
            groups.insert(String(head.suffix(2)), at: 0)
            head = String(head.dropLast(2))
        }
        if !head.isEmpty { groups.insert(head, at: 0) }
        return sign + (groups + [tail]).joined(separator: ",")
    }

    /// One decimal with a "." separator: "4.9", "5.0".
    static func rating(_ value: Double) -> String {
        String(format: "%.1f", value)
    }

    /// "1.2 km"
    static func distance(_ km: Double) -> String {
        Strings.restaurantDistance(distance: String(format: "%.1f", km))
    }

    /// "1284 reviews": counts are printed without locale grouping, like the other platforms.
    static func reviewCount(_ count: Int) -> String {
        plain("restaurant.reviewCount", count)
    }

    static func monthShort(_ month: Int) -> String {
        switch month {
        case 1: Strings.dateMonthShortJan
        case 2: Strings.dateMonthShortFeb
        case 3: Strings.dateMonthShortMar
        case 4: Strings.dateMonthShortApr
        case 5: Strings.dateMonthShortMay
        case 6: Strings.dateMonthShortJun
        case 7: Strings.dateMonthShortJul
        case 8: Strings.dateMonthShortAug
        case 9: Strings.dateMonthShortSep
        case 10: Strings.dateMonthShortOct
        case 11: Strings.dateMonthShortNov
        default: Strings.dateMonthShortDec
        }
    }

    static func monthLong(_ month: Int) -> String {
        switch month {
        case 1: Strings.dateMonthJan
        case 2: Strings.dateMonthFeb
        case 3: Strings.dateMonthMar
        case 4: Strings.dateMonthApr
        case 5: Strings.dateMonthMay
        case 6: Strings.dateMonthJun
        case 7: Strings.dateMonthJul
        case 8: Strings.dateMonthAug
        case 9: Strings.dateMonthSep
        case 10: Strings.dateMonthOct
        case 11: Strings.dateMonthNov
        default: Strings.dateMonthDec
        }
    }

    /// A string from contracts/strings formatted without locale-specific number grouping.
    private static func plain(_ key: String, _ arguments: any CVarArg...) -> String {
        String(format: NSLocalizedString(key, comment: ""), locale: nil, arguments: arguments)
    }
}

/// Search text matching (spec/features/catalog.md): case- and diacritic-insensitive "contains".
nonisolated enum TextSearch {
    static func fold(_ text: String) -> String {
        text.folding(options: [.diacriticInsensitive, .caseInsensitive, .widthInsensitive], locale: nil).lowercased()
    }

    static func matches(_ text: String, _ query: String) -> Bool {
        let folded = fold(query.trimmingCharacters(in: .whitespacesAndNewlines))
        if folded.isEmpty { return true }
        return fold(text).contains(folded)
    }
}

/// Initials: the first letters of the first and last words of a name, uppercased.
nonisolated enum Initials {
    static func of(_ name: String) -> String {
        let words = name.split(whereSeparator: \.isWhitespace)
        guard let first = words.first?.first else { return "" }
        guard words.count > 1, let last = words.last?.first else { return String(first).uppercased() }
        return (String(first) + String(last)).uppercased()
    }

    /// The text before the first space.
    static func firstName(_ name: String) -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.split(separator: " ").first.map(String.init) ?? trimmed
    }
}
