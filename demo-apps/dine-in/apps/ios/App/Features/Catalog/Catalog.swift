import Foundation
import SwiftUI

/// The bundled restaurant catalog (spec/features/catalog.md). Field names match the other platforms.
nonisolated struct Catalog: Equatable, Sendable {
    var version: Int
    var heroImage: String
    var welcomeImage: String
    var cuisines: [CuisineId]
    var collections: [Collection]
    var restaurants: [Restaurant]

    func restaurant(_ id: String) -> Restaurant? {
        restaurants.first { $0.id == id }
    }
}

nonisolated enum CuisineId: String, Codable, CaseIterable, Sendable, Identifiable {
    case italian, japanese, indian, french, mediterranean, asian, continental

    var id: Self { self }

    var label: String {
        switch self {
        case .italian: Strings.cuisineItalian
        case .japanese: Strings.cuisineJapanese
        case .indian: Strings.cuisineIndian
        case .french: Strings.cuisineFrench
        case .mediterranean: Strings.cuisineMediterranean
        case .asian: Strings.cuisineAsian
        case .continental: Strings.cuisineContinental
        }
    }
}

nonisolated enum CollectionId: String, Codable, CaseIterable, Sendable, Identifiable {
    case mostLoved, fineDining, romantic, rooftop, hiddenGems, chefsPicks

    var id: Self { self }

    var title: String {
        switch self {
        case .mostLoved: Strings.collectionMostLovedTitle
        case .fineDining: Strings.collectionFineDiningTitle
        case .romantic: Strings.collectionRomanticTitle
        case .rooftop: Strings.collectionRooftopTitle
        case .hiddenGems: Strings.collectionHiddenGemsTitle
        case .chefsPicks: Strings.collectionChefsPicksTitle
        }
    }

    var subtitle: String {
        switch self {
        case .mostLoved: Strings.collectionMostLovedSubtitle
        case .fineDining: Strings.collectionFineDiningSubtitle
        case .romantic: Strings.collectionRomanticSubtitle
        case .rooftop: Strings.collectionRooftopSubtitle
        case .hiddenGems: Strings.collectionHiddenGemsSubtitle
        case .chefsPicks: Strings.collectionChefsPicksSubtitle
        }
    }
}

nonisolated enum AmenityId: String, Codable, CaseIterable, Sendable, Identifiable {
    case valet, sommelier, privateDining, liveMusic, rooftop, accessible, bar, chefsTable, garden, wifi

    var id: Self { self }

    var label: String {
        switch self {
        case .valet: Strings.amenityValet
        case .sommelier: Strings.amenitySommelier
        case .privateDining: Strings.amenityPrivateDining
        case .liveMusic: Strings.amenityLiveMusic
        case .rooftop: Strings.amenityRooftop
        case .accessible: Strings.amenityAccessible
        case .bar: Strings.amenityBar
        case .chefsTable: Strings.amenityChefsTable
        case .garden: Strings.amenityGarden
        case .wifi: Strings.amenityWifi
        }
    }

    var icon: ImageResource {
        switch self {
        case .valet: AppIcon.amenityValet
        case .sommelier: AppIcon.amenitySommelier
        case .privateDining: AppIcon.amenityPrivateDining
        case .liveMusic: AppIcon.amenityLiveMusic
        case .rooftop: AppIcon.amenityRooftop
        case .accessible: AppIcon.amenityAccessible
        case .bar: AppIcon.amenityBar
        case .chefsTable: AppIcon.amenityChefsTable
        case .garden: AppIcon.amenityGarden
        case .wifi: AppIcon.amenityWifi
        }
    }
}

nonisolated enum Seating: String, Codable, CaseIterable, Sendable, Identifiable {
    case indoor, outdoor, window, `private`

    var id: Self { self }

    var label: String {
        switch self {
        case .indoor: Strings.seatingIndoor
        case .outdoor: Strings.seatingOutdoor
        case .window: Strings.seatingWindow
        case .private: Strings.seatingPrivate
        }
    }

    var icon: ImageResource {
        switch self {
        case .indoor: AppIcon.seatingIndoor
        case .outdoor: AppIcon.seatingOutdoor
        case .window: AppIcon.seatingWindow
        case .private: AppIcon.seatingPrivate
        }
    }
}

nonisolated struct Collection: Equatable, Sendable, Identifiable {
    var id: CollectionId
    var image: String
}

nonisolated struct OpeningHours: Codable, Equatable, Sendable {
    var open: String
    var close: String
}

nonisolated struct Dish: Codable, Equatable, Sendable {
    var name: String
    var description: String
    var price: Int
    var image: String
}

nonisolated struct MenuItem: Codable, Equatable, Sendable {
    var name: String
    var description: String
    var price: Int
}

nonisolated struct Review: Codable, Equatable, Sendable {
    var author: String
    var rating: Int
    var date: String
    var text: String
}

nonisolated struct Restaurant: Equatable, Sendable, Identifiable {
    var id: String
    var name: String
    var cuisine: CuisineId
    var neighbourhood: String
    var address: String
    var phone: String
    var latitude: Double
    var longitude: Double
    var distanceKm: Double
    var rating: Double
    var reviewCount: Int
    var priceLevel: Int
    var costForTwo: Int
    var tagline: String
    var about: String
    var ambience: String
    var dressCode: String?
    var featured: Bool
    var collections: [CollectionId]
    var amenities: [AmenityId]
    var seating: [Seating]
    var maxPartySize: Int
    var demandPercent: Int
    /// Keyed by `Weekday.key` ("mon" … "sun"); a missing or null day is closed.
    var openingHours: [String: OpeningHours]
    var heroImage: String
    var gallery: [String]
    var signatureDishes: [Dish]
    var menuHighlights: [MenuItem]
    var reviews: [Review]

    func hours(on weekday: Weekday) -> OpeningHours? {
        openingHours[weekday.key]
    }
}

/// Monday-first weekdays, with the keys used in the catalog and in strings.
nonisolated enum Weekday: Int, CaseIterable, Sendable, Identifiable {
    case mon, tue, wed, thu, fri, sat, sun

    var id: Self { self }

    var key: String {
        switch self {
        case .mon: "mon"
        case .tue: "tue"
        case .wed: "wed"
        case .thu: "thu"
        case .fri: "fri"
        case .sat: "sat"
        case .sun: "sun"
        }
    }

    var label: String {
        switch self {
        case .mon: Strings.dateWeekdayMon
        case .tue: Strings.dateWeekdayTue
        case .wed: Strings.dateWeekdayWed
        case .thu: Strings.dateWeekdayThu
        case .fri: Strings.dateWeekdayFri
        case .sat: Strings.dateWeekdaySat
        case .sun: Strings.dateWeekdaySun
        }
    }

    var shortLabel: String {
        switch self {
        case .mon: Strings.dateWeekdayShortMon
        case .tue: Strings.dateWeekdayShortTue
        case .wed: Strings.dateWeekdayShortWed
        case .thu: Strings.dateWeekdayShortThu
        case .fri: Strings.dateWeekdayShortFri
        case .sat: Strings.dateWeekdayShortSat
        case .sun: Strings.dateWeekdayShortSun
        }
    }
}

// MARK: - Decoding

/// Unknown enum values are skipped, so an older app keeps working with a newer catalog.
extension Catalog: Decodable {
    private enum CodingKeys: String, CodingKey {
        case version, heroImage, welcomeImage, cuisines, collections, restaurants
    }

    private struct RawCollection: Decodable {
        var id: String
        var image: String
    }

    nonisolated init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        version = try container.decode(Int.self, forKey: .version)
        heroImage = try container.decode(String.self, forKey: .heroImage)
        welcomeImage = try container.decode(String.self, forKey: .welcomeImage)
        cuisines = try container.decode([String].self, forKey: .cuisines).compactMap(CuisineId.init(rawValue:))
        collections = try container.decode([RawCollection].self, forKey: .collections).compactMap { raw in
            CollectionId(rawValue: raw.id).map { Collection(id: $0, image: raw.image) }
        }
        restaurants = try container.decode([Lossy<Restaurant>].self, forKey: .restaurants).compactMap(\.value)
    }
}

extension Restaurant: Decodable {
    private enum CodingKeys: String, CodingKey {
        case id, name, cuisine, neighbourhood, address, phone, latitude, longitude, distanceKm, rating
        case reviewCount, priceLevel, costForTwo, tagline, about, ambience, dressCode, featured
        case collections, amenities, seating, maxPartySize, demandPercent, openingHours, heroImage
        case gallery, signatureDishes, menuHighlights, reviews
    }

    nonisolated init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let rawCuisine = try c.decode(String.self, forKey: .cuisine)
        guard let cuisine = CuisineId(rawValue: rawCuisine) else {
            throw DecodingError.dataCorruptedError(forKey: .cuisine, in: c, debugDescription: rawCuisine)
        }
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        self.cuisine = cuisine
        neighbourhood = try c.decode(String.self, forKey: .neighbourhood)
        address = try c.decode(String.self, forKey: .address)
        phone = try c.decode(String.self, forKey: .phone)
        latitude = try c.decode(Double.self, forKey: .latitude)
        longitude = try c.decode(Double.self, forKey: .longitude)
        distanceKm = try c.decode(Double.self, forKey: .distanceKm)
        rating = try c.decode(Double.self, forKey: .rating)
        reviewCount = try c.decode(Int.self, forKey: .reviewCount)
        priceLevel = try c.decode(Int.self, forKey: .priceLevel)
        costForTwo = try c.decode(Int.self, forKey: .costForTwo)
        tagline = try c.decode(String.self, forKey: .tagline)
        about = try c.decode(String.self, forKey: .about)
        ambience = try c.decode(String.self, forKey: .ambience)
        dressCode = try c.decodeIfPresent(String.self, forKey: .dressCode)
        featured = try c.decode(Bool.self, forKey: .featured)
        collections = try c.decode([String].self, forKey: .collections).compactMap(CollectionId.init(rawValue:))
        amenities = try c.decode([String].self, forKey: .amenities).compactMap(AmenityId.init(rawValue:))
        seating = try c.decode([String].self, forKey: .seating).compactMap(Seating.init(rawValue:))
        maxPartySize = try c.decode(Int.self, forKey: .maxPartySize)
        demandPercent = try c.decode(Int.self, forKey: .demandPercent)
        let hours = try c.decode([String: OpeningHours?].self, forKey: .openingHours)
        openingHours = hours.compactMapValues { $0 }
        heroImage = try c.decode(String.self, forKey: .heroImage)
        gallery = try c.decode([String].self, forKey: .gallery)
        signatureDishes = try c.decode([Dish].self, forKey: .signatureDishes)
        menuHighlights = try c.decode([MenuItem].self, forKey: .menuHighlights)
        reviews = try c.decode([Review].self, forKey: .reviews)
    }
}

/// Decodes a value, or nil if it fails, so one bad element doesn't fail the whole array.
nonisolated struct Lossy<Value: Decodable>: Decodable {
    let value: Value?

    init(from decoder: any Decoder) throws {
        value = try? decoder.singleValueContainer().decode(Value.self)
    }
}
