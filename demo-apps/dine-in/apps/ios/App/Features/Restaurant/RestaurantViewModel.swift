import Foundation
import Observation

/// The OpenStreetMap tile at zoom 16 containing a coordinate, and the coordinate's position in it.
nonisolated struct MapTile: Equatable, Sendable {
    static let zoom = 16
    let x: Int
    let y: Int
    /// The coordinate's position inside the tile, 0…1 from the top-leading corner.
    let fractionX: Double
    let fractionY: Double

    init(latitude: Double, longitude: Double) {
        let scale = pow(2.0, Double(Self.zoom))
        let lat = latitude * .pi / 180
        let exactX = (longitude + 180) / 360 * scale
        let exactY = (1 - log(tan(lat) + 1 / cos(lat)) / .pi) / 2 * scale
        x = Int(exactX.rounded(.down))
        y = Int(exactY.rounded(.down))
        fractionX = exactX - Double(x)
        fractionY = exactY - Double(y)
    }

    var url: String {
        "https://tile.openstreetmap.org/\(Self.zoom)/\(x)/\(y).png"
    }
}

/// One row of the opening hours.
nonisolated struct HoursRow: Equatable, Identifiable, Sendable {
    let weekday: Weekday
    /// `format.timeRange` of the hours, or `restaurant.closed`.
    let text: String
    let isClosed: Bool
    let isToday: Bool

    var id: Weekday { weekday }
}

@Observable
final class RestaurantViewModel {
    enum State {
        case loading, failed, notFound
        case loaded(Restaurant)
    }

    let restaurantId: String
    private(set) var state: State = .loading
    @ObservationIgnored let session: MemberSession

    init(session: MemberSession, restaurantId: String) {
        self.session = session
        self.restaurantId = restaurantId
    }

    func load() async {
        if case .loaded = state { return }
        state = .loading
        do {
            let catalog = try await session.catalogRepository.load()
            state = catalog.restaurant(restaurantId).map(State.loaded) ?? .notFound
        } catch {
            state = .failed
        }
    }

    var availability: TodayAvailability? {
        guard case .loaded(let restaurant) = state else { return nil }
        return DemoAvailability.today(restaurant, now: session.now())
    }

    /// Monday → Sunday, closed days as Closed, today emphasised.
    static func hours(_ restaurant: Restaurant, now: Date) -> [HoursRow] {
        let today = LocalDate(now).weekday
        return Weekday.allCases.map { day in
            if let hours = restaurant.hours(on: day) {
                HoursRow(weekday: day, text: Formatters.timeRange(hours), isClosed: false, isToday: day == today)
            } else {
                HoursRow(weekday: day, text: Strings.restaurantClosed, isClosed: true, isToday: day == today)
            }
        }
    }

    func hours(_ restaurant: Restaurant) -> [HoursRow] {
        Self.hours(restaurant, now: session.now())
    }

    static func directionsURL(_ restaurant: Restaurant) -> URL? {
        URL(string: "http://maps.apple.com/?daddr=\(restaurant.latitude),\(restaurant.longitude)")
    }

    static func callURL(_ restaurant: Restaurant) -> URL? {
        URL(string: "tel:\(restaurant.phone.filter { !$0.isWhitespace })")
    }
}
