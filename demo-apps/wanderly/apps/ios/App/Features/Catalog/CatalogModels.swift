import Foundation
import SwiftUI

/// Travel mood used to browse. Order matches Home and Explore chips.
nonisolated enum TravelCategory: String, CaseIterable, Identifiable, Codable, Sendable {
    case beaches
    case mountains
    case adventure
    case history
    case food

    var id: String { rawValue }

    var label: String {
        switch self {
        case .beaches: Strings.categoryBeaches
        case .mountains: Strings.categoryMountains
        case .adventure: Strings.categoryAdventure
        case .history: Strings.categoryHistory
        case .food: Strings.categoryFood
        }
    }

    var icon: ImageResource {
        switch self {
        case .beaches: AppIcon.waves
        case .mountains: AppIcon.mountain
        case .adventure: AppIcon.sparkles
        case .history: AppIcon.landmark
        case .food: AppIcon.utensils
        }
    }
}

/// Type of a place in the catalog.
nonisolated enum PlaceKind: String, CaseIterable, Identifiable, Codable, Sendable {
    case attraction
    case hotel
    case restaurant
    case activity

    var id: String { rawValue }

    var label: String {
        switch self {
        case .attraction: Strings.kindAttraction
        case .hotel: Strings.kindHotel
        case .restaurant: Strings.kindRestaurant
        case .activity: Strings.kindActivity
        }
    }
}

/// Kind stored on a saved item. Destinations use `destination`.
nonisolated enum SavedKind: String, Codable, Sendable, Equatable {
    case destination
    case attraction
    case hotel
    case restaurant
    case activity

    init(placeKind: PlaceKind) {
        switch placeKind {
        case .attraction: self = .attraction
        case .hotel: self = .hotel
        case .restaurant: self = .restaurant
        case .activity: self = .activity
        }
    }

    var placeKind: PlaceKind? {
        switch self {
        case .destination: nil
        case .attraction: .attraction
        case .hotel: .hotel
        case .restaurant: .restaurant
        case .activity: .activity
        }
    }

    var label: String {
        switch self {
        case .destination: Strings.kindDestination
        case .attraction: Strings.kindAttraction
        case .hotel: Strings.kindHotel
        case .restaurant: Strings.kindRestaurant
        case .activity: Strings.kindActivity
        }
    }
}

nonisolated enum BudgetBand: String, CaseIterable, Identifiable, Codable, Sendable {
    case value
    case mid
    case luxury

    var id: String { rawValue }

    var label: String {
        switch self {
        case .value: Strings.budgetValue
        case .mid: Strings.budgetMid
        case .luxury: Strings.budgetLuxury
        }
    }
}

nonisolated struct WeatherInfo: Codable, Equatable, Sendable {
    var summary: String
    var tempC: Int
    var season: String
}

nonisolated struct BudgetBandEstimate: Codable, Equatable, Sendable {
    var lodging: Int
    var food: Int
    var activities: Int
}

nonisolated struct BudgetEstimates: Codable, Equatable, Sendable {
    var value: BudgetBandEstimate
    var mid: BudgetBandEstimate
    var luxury: BudgetBandEstimate

    func estimate(for band: BudgetBand) -> BudgetBandEstimate {
        switch band {
        case .value: value
        case .mid: mid
        case .luxury: luxury
        }
    }
}

nonisolated struct ItineraryTemplateItem: Codable, Equatable, Sendable {
    var placeId: String
    var startTime: String
    var durationMinutes: Int
}

nonisolated struct ItineraryTemplate: Codable, Equatable, Sendable {
    var title: String
    var items: [ItineraryTemplateItem]
}

nonisolated struct Destination: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var name: String
    var country: String
    var tagline: String
    var description: String
    var imageUrl: String
    var gallery: [String]
    var categories: [String]
    var trending: Bool
    var featured: Bool
    var bestTimeToVisit: String
    var currency: String
    var currencySymbol: String
    var language: String
    var weather: WeatherInfo
    var travelTips: [String]
    var budgetEstimates: BudgetEstimates
    var itineraryTemplates: [ItineraryTemplate]
}

nonisolated struct Place: Codable, Equatable, Identifiable, Sendable {
    var rating: Double
    var reviewCount: Int
    var openingHours: String
    var durationMinutes: Int
    var priceLevel: Int
    var popular: Bool
    var id: String
    var destinationId: String
    var kind: PlaceKind
    var name: String
    var summary: String
    var description: String
    var imageUrl: String
    var gallery: [String]?
    var location: String
    var pricePerNight: Int?
    var category: String

    var heroURLs: [String] {
        let extras = gallery ?? []
        return [imageUrl] + extras.filter { $0 != imageUrl }
    }
}

nonisolated struct Catalog: Codable, Equatable, Sendable {
    var fallbackImageUrl: String
    var inspirationDestinationIds: [String]
    var destinations: [Destination]
    var places: [Place]

    static let empty = Catalog(
        fallbackImageUrl: "",
        inspirationDestinationIds: [],
        destinations: [],
        places: []
    )

    func destination(id: String) -> Destination? {
        destinations.first { $0.id == id }
    }

    func place(id: String) -> Place? {
        places.first { $0.id == id }
    }

    func places(destinationId: String, kind: PlaceKind) -> [Place] {
        places.filter { $0.destinationId == destinationId && $0.kind == kind }
    }

    func places(destinationId: String) -> [Place] {
        places.filter { $0.destinationId == destinationId }
    }

    var featured: Destination? {
        destinations.first { $0.featured }
    }

    var trending: [Destination] {
        destinations.filter(\.trending)
    }

    var inspiration: [Destination] {
        inspirationDestinationIds.compactMap { destination(id: $0) }
    }

    var popularPlaces: [Place] {
        places.filter(\.popular)
    }
}

enum CatalogError: Error {
    case missingResource
}

extension Catalog {
    static func decode(from data: Data) throws -> Catalog {
        try JSONDecoder().decode(Catalog.self, from: data)
    }

    static func loadFromBundle(_ bundle: Bundle = Bundle(for: AppContainer.self)) throws -> Catalog {
        guard let url = bundle.url(forResource: "catalog", withExtension: "json") else {
            throw CatalogError.missingResource
        }
        let data = try Data(contentsOf: url)
        return try decode(from: data)
    }
}

enum AppFormat {
    static func rating(_ value: Double) -> String {
        String(format: "%.1f", value)
    }

    static func int(_ value: Int) -> String {
        String(value)
    }

    static func mediumDate(_ string: String) -> String {
        guard let date = TripDates.date(from: string) else { return string }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}
