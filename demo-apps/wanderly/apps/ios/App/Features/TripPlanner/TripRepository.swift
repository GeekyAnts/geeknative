import Foundation
import Observation

protocol TripRepository: AnyObject {
    var trips: [Trip] { get }
    func trip(id: String) -> Trip?
    func save(_ trip: Trip)
    func delete(id: String)
    func generate(
        destination: Destination,
        startDate: String,
        endDate: String,
        travelers: Int,
        budgetBand: BudgetBand,
        interests: [String],
        catalog: Catalog
    ) throws -> Trip
}

enum TripStorage {
    static let key = "trips.list"
}

enum PlannerValidationError: Error, Equatable {
    case destination
    case date
    case range
}

enum TripGeneration {
    static let maxStayDays = 14
    static let maxItineraryDays = 7
    static let defaultAddTime = "09:00"
    static let alternateAddTime = "18:00"

    static func itineraryDayCount(startDate: String, endDate: String) throws -> Int {
        guard let inclusive = TripDates.daysInclusive(from: startDate, to: endDate) else {
            throw PlannerValidationError.date
        }
        if inclusive < 1 { throw PlannerValidationError.date }
        if inclusive > maxStayDays { throw PlannerValidationError.range }
        return min(max(inclusive, 1), maxItineraryDays)
    }

    static func generate(
        destination: Destination,
        startDate: String,
        endDate: String,
        travelers: Int,
        budgetBand: BudgetBand,
        interests: [String],
        catalog: Catalog
    ) throws -> Trip {
        let dayCount = try itineraryDayCount(startDate: startDate, endDate: endDate)
        let templates = destination.itineraryTemplates
        var days: [TripDay] = []
        for index in 0..<dayCount {
            let template = templates.isEmpty ? ItineraryTemplate(title: "", items: []) : templates[index % templates.count]
            let date = TripDates.addDays(startDate, index) ?? startDate
            var items: [TripItem] = template.items.map { item in
                TripItem(
                    id: UUID().uuidString,
                    placeId: item.placeId,
                    startTime: item.startTime,
                    durationMinutes: item.durationMinutes,
                    completed: false
                )
            }
            if !interests.isEmpty {
                items = stableSort(items, interests: interests, catalog: catalog)
            }
            days.append(TripDay(dayIndex: index + 1, date: date, items: items))
        }
        return Trip(
            id: UUID().uuidString,
            destinationId: destination.id,
            title: destination.name,
            startDate: startDate,
            endDate: endDate,
            travelers: min(max(travelers, 1), 8),
            budgetBand: budgetBand,
            interests: interests,
            status: .draft,
            days: days
        )
    }

    /// Matching categories first; never drops items. Stable.
    static func stableSort(_ items: [TripItem], interests: [String], catalog: Catalog) -> [TripItem] {
        let interestSet = Set(interests)
        return items.enumerated().sorted { lhs, rhs in
            let leftMatch = catalog.place(id: lhs.element.placeId).map { interestSet.contains($0.category) } ?? false
            let rightMatch = catalog.place(id: rhs.element.placeId).map { interestSet.contains($0.category) } ?? false
            if leftMatch != rightMatch { return leftMatch && !rightMatch }
            return lhs.offset < rhs.offset
        }.map(\.element)
    }

    static func startTimeForNewItem(on day: TripDay) -> String {
        if day.items.contains(where: { $0.startTime == defaultAddTime }) {
            return alternateAddTime
        }
        return defaultAddTime
    }
}

@Observable
final class UserDefaultsTripRepository: TripRepository {
    private(set) var trips: [Trip]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        trips = Self.load(from: defaults)
        rewritePastIfNeeded()
    }

    func trip(id: String) -> Trip? {
        trips.first { $0.id == id }
    }

    func save(_ trip: Trip) {
        if let index = trips.firstIndex(where: { $0.id == trip.id }) {
            trips[index] = trip
        } else {
            trips.insert(trip, at: 0)
        }
        persist()
    }

    func delete(id: String) {
        trips.removeAll { $0.id == id }
        persist()
    }

    func generate(
        destination: Destination,
        startDate: String,
        endDate: String,
        travelers: Int,
        budgetBand: BudgetBand,
        interests: [String],
        catalog: Catalog
    ) throws -> Trip {
        let trip = try TripGeneration.generate(
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            travelers: travelers,
            budgetBand: budgetBand,
            interests: interests,
            catalog: catalog
        )
        save(trip)
        return trip
    }

    private func rewritePastIfNeeded() {
        let today = TripDates.today()
        var changed = false
        for index in trips.indices {
            let rewritten = TripClassification.rewrittenStatus(for: trips[index], today: today)
            if rewritten != trips[index].status {
                trips[index].status = rewritten
                changed = true
            }
        }
        if changed { persist() }
    }

    static func load(from defaults: UserDefaults) -> [Trip] {
        let data: Data?
        if let stored = defaults.data(forKey: TripStorage.key) {
            data = stored
        } else if let string = defaults.string(forKey: TripStorage.key) {
            data = string.data(using: .utf8)
        } else {
            return []
        }
        guard let data, let decoded = try? JSONDecoder().decode([Trip].self, from: data) else {
            return []
        }
        return decoded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(trips),
              let string = String(data: data, encoding: .utf8) else { return }
        defaults.set(string, forKey: TripStorage.key)
    }
}

@Observable
final class InMemoryTripRepository: TripRepository {
    private(set) var trips: [Trip]

    init(trips: [Trip] = []) {
        self.trips = trips
    }

    func trip(id: String) -> Trip? {
        trips.first { $0.id == id }
    }

    func save(_ trip: Trip) {
        if let index = trips.firstIndex(where: { $0.id == trip.id }) {
            trips[index] = trip
        } else {
            trips.insert(trip, at: 0)
        }
    }

    func delete(id: String) {
        trips.removeAll { $0.id == id }
    }

    func generate(
        destination: Destination,
        startDate: String,
        endDate: String,
        travelers: Int,
        budgetBand: BudgetBand,
        interests: [String],
        catalog: Catalog
    ) throws -> Trip {
        let trip = try TripGeneration.generate(
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            travelers: travelers,
            budgetBand: budgetBand,
            interests: interests,
            catalog: catalog
        )
        save(trip)
        return trip
    }
}
