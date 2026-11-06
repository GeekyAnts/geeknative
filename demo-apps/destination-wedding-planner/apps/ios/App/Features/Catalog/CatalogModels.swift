import Foundation

/// Style values a destination may include. Stored as these exact raw values on every platform.
enum WeddingStyle: String, CaseIterable, Identifiable, Codable, Sendable {
    case beach
    case royal
    case garden
    case mountain
    case heritage
    case luxuryResort

    var id: String { rawValue }

    var label: String {
        switch self {
        case .beach: Strings.styleBeach
        case .royal: Strings.styleRoyal
        case .garden: Strings.styleGarden
        case .mountain: Strings.styleMountain
        case .heritage: Strings.styleHeritage
        case .luxuryResort: Strings.styleLuxuryResort
        }
    }
}

enum BookingStatus: String, CaseIterable, Codable, Sendable {
    case none
    case enquirySent
    case confirmed

    var label: String {
        switch self {
        case .none: Strings.weddingStatusNone
        case .enquirySent: Strings.weddingStatusEnquirySent
        case .confirmed: Strings.weddingStatusConfirmed
        }
    }
}

enum TaskId: String, CaseIterable, Identifiable, Codable, Sendable {
    case venue
    case guests
    case attire
    case photography
    case catering
    case decor
    case invitations
    case travel
    case ceremony
    case reception

    var id: String { rawValue }

    var label: String {
        switch self {
        case .venue: Strings.weddingTaskVenue
        case .guests: Strings.weddingTaskGuests
        case .attire: Strings.weddingTaskAttire
        case .photography: Strings.weddingTaskPhotography
        case .catering: Strings.weddingTaskCatering
        case .decor: Strings.weddingTaskDecor
        case .invitations: Strings.weddingTaskInvitations
        case .travel: Strings.weddingTaskTravel
        case .ceremony: Strings.weddingTaskCeremony
        case .reception: Strings.weddingTaskReception
        }
    }
}

struct Destination: Identifiable, Hashable, Sendable {
    var id: String
    var name: String
    var country: String
    var region: String
    var tagline: String
    var description: String
    var seasonalNote: String
    var styles: [WeddingStyle]
    var guestCapacityMin: Int
    var guestCapacityMax: Int
    var budgetMin: Int
    var imageUrl: String
    var gallery: [String]
    var venueIds: [String]
    var packageIds: [String]
}

struct Review: Hashable, Sendable {
    var author: String
    var rating: Int
    var body: String
}

struct Venue: Identifiable, Hashable, Sendable {
    var id: String
    var destinationId: String
    var name: String
    var description: String
    var highlights: [String]
    var location: String
    var latitude: Double
    var longitude: Double
    var capacity: Int
    var spaces: [String]
    var accommodation: String
    var amenities: [String]
    var priceFrom: Int
    var packageIds: [String]
    var rating: Double
    var reviewCount: Int
    var reviews: [Review]
    var imageUrl: String
    var gallery: [String]
}

struct Experience: Identifiable, Hashable, Sendable {
    var id: String
    var name: String
    var description: String
    var priceFrom: Int
    var imageUrl: String
    var icon: String
}

struct WeddingPackage: Identifiable, Hashable, Sendable {
    var id: String
    var name: String
    var description: String
    var includedGuests: Int
    var extraGuestPrice: Int
    var basePrice: Int
    var venueShare: Int
    var accommodationShare: Int
    var cateringShare: Int
    var decorationShare: Int
    var photographyShare: Int
    var includes: [String]
    var imageUrl: String
}

struct Enquiry: Identifiable, Hashable, Codable, Sendable {
    var id: String
    var venueId: String
    var experienceId: String
    var coupleName: String
    var email: String
    var date: String
    var guests: Int
    var message: String
    var createdAt: String
}

struct WeddingPlan: Equatable, Codable, Sendable {
    var date: String
    var destinationId: String
    var venueId: String
    var guestCount: Int
    var budget: Int
    var packageId: String
    var bookingStatus: BookingStatus
    var savedDestinationIds: [String]
    var savedVenueIds: [String]
    var completedTaskIds: [String]
    var selectedExperienceIds: [String]
    var searchLocation: String
    var searchDate: String
    var searchGuests: Int
    var searchBudget: Int

    static let empty = WeddingPlan(
        date: "",
        destinationId: "",
        venueId: "",
        guestCount: 80,
        budget: 0,
        packageId: "",
        bookingStatus: .none,
        savedDestinationIds: [],
        savedVenueIds: [],
        completedTaskIds: [],
        selectedExperienceIds: [],
        searchLocation: "",
        searchDate: "",
        searchGuests: 0,
        searchBudget: 0
    )

    static let planStorageKey = "wedding.plan"
    static let enquiriesStorageKey = "wedding.enquiries"
}

struct BudgetBreakdown: Equatable, Sendable {
    var venue: Int
    var accommodation: Int
    var catering: Int
    var decoration: Int
    var photography: Int
    var experiences: Int
    var total: Int
}

struct DestinationFilters: Equatable, Sendable {
    var location: String = ""
    var style: WeddingStyle?
    var guests: Int = 0
    var budget: Int = 0
}

struct VenueFilters: Equatable, Sendable {
    var destinationId: String = ""
    var guests: Int = 0
    var budget: Int = 0
}

enum CatalogFilters {
    static func destinations(_ filters: DestinationFilters, in catalog: [Destination] = WeddingCatalog.destinations) -> [Destination] {
        let needle = filters.location.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return catalog.filter { destination in
            if !needle.isEmpty {
                let haystack = "\(destination.name) \(destination.country) \(destination.region)".lowercased()
                if !haystack.contains(needle) { return false }
            }
            if let style = filters.style, !destination.styles.contains(style) { return false }
            if filters.guests > 0, destination.guestCapacityMax < filters.guests { return false }
            if filters.budget > 0, destination.budgetMin > filters.budget { return false }
            return true
        }
    }

    static func venues(_ filters: VenueFilters, in catalog: [Venue] = WeddingCatalog.venues) -> [Venue] {
        catalog.filter { venue in
            if !filters.destinationId.isEmpty, venue.destinationId != filters.destinationId { return false }
            if filters.guests > 0, venue.capacity < filters.guests { return false }
            if filters.budget > 0, venue.priceFrom > filters.budget { return false }
            return true
        }
    }

    /// Destinations whose seasonal note mentions the current UTC month; otherwise the first three.
    static func seasonalDestinations(
        month: Int? = nil,
        in catalog: [Destination] = WeddingCatalog.destinations,
        today: Date = Date()
    ) -> [Destination] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? TimeZone.current
        let monthIndex = month ?? calendar.component(.month, from: today) - 1
        let names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ]
        let season = names[max(0, min(monthIndex, names.count - 1))]
        let matched = catalog.filter { $0.seasonalNote.contains(season) }
        return matched.isEmpty ? Array(catalog.prefix(3)) : matched
    }

    static func budgetBreakdown(
        package: WeddingPackage,
        guests: Int,
        selectedExperienceIds: [String],
        experiences: [Experience] = WeddingCatalog.experiences
    ) -> BudgetBreakdown {
        let extraGuests = max(0, guests - package.includedGuests)
        let extraCatering = extraGuests * package.extraGuestPrice
        let experienceTotal = selectedExperienceIds.reduce(0) { sum, id in
            sum + (experiences.first { $0.id == id }?.priceFrom ?? 0)
        }
        return BudgetBreakdown(
            venue: package.venueShare,
            accommodation: package.accommodationShare,
            catering: package.cateringShare + extraCatering,
            decoration: package.decorationShare,
            photography: package.photographyShare,
            experiences: experienceTotal,
            total: package.basePrice + extraCatering + experienceTotal
        )
    }
}

enum CatalogFormat {
    static func amount(_ value: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.locale = Locale(identifier: "en_US")
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    static func parsePositiveInt(_ text: String) -> Int {
        let parsed = Int(text.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
        return parsed > 0 ? parsed : 0
    }

    /// Calendar days from today (UTC date) to an ISO yyyy-MM-dd, floored at 0.
    static func daysRemaining(_ date: String, today: Date = Date()) -> Int {
        guard let target = ISODate.date(from: date) else { return 0 }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? TimeZone.current
        let start = calendar.startOfDay(for: today)
        let end = calendar.startOfDay(for: target)
        let days = calendar.dateComponents([.day], from: start, to: end).day ?? 0
        return max(0, days)
    }
}

enum ISODate {
    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static func string(from date: Date) -> String {
        formatter.string(from: date)
    }

    static func date(from string: String) -> Date? {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return formatter.date(from: trimmed)
    }
}

func withToggledId(_ ids: [String], _ id: String) -> [String] {
    ids.contains(id) ? ids.filter { $0 != id } : ids + [id]
}

func mergePlan(_ base: WeddingPlan, _ patch: WeddingPlanPatch) -> WeddingPlan {
    var next = base
    if let date = patch.date { next.date = date }
    if let destinationId = patch.destinationId { next.destinationId = destinationId }
    if let venueId = patch.venueId { next.venueId = venueId }
    if let guestCount = patch.guestCount { next.guestCount = guestCount }
    if let budget = patch.budget { next.budget = budget }
    if let packageId = patch.packageId { next.packageId = packageId }
    if let bookingStatus = patch.bookingStatus { next.bookingStatus = bookingStatus }
    if let savedDestinationIds = patch.savedDestinationIds { next.savedDestinationIds = savedDestinationIds }
    if let savedVenueIds = patch.savedVenueIds { next.savedVenueIds = savedVenueIds }
    if let completedTaskIds = patch.completedTaskIds { next.completedTaskIds = completedTaskIds }
    if let selectedExperienceIds = patch.selectedExperienceIds { next.selectedExperienceIds = selectedExperienceIds }
    if let searchLocation = patch.searchLocation { next.searchLocation = searchLocation }
    if let searchDate = patch.searchDate { next.searchDate = searchDate }
    if let searchGuests = patch.searchGuests { next.searchGuests = searchGuests }
    if let searchBudget = patch.searchBudget { next.searchBudget = searchBudget }
    return next
}

struct WeddingPlanPatch {
    var date: String?
    var destinationId: String?
    var venueId: String?
    var guestCount: Int?
    var budget: Int?
    var packageId: String?
    var bookingStatus: BookingStatus?
    var savedDestinationIds: [String]?
    var savedVenueIds: [String]?
    var completedTaskIds: [String]?
    var selectedExperienceIds: [String]?
    var searchLocation: String?
    var searchDate: String?
    var searchGuests: Int?
    var searchBudget: Int?
}
