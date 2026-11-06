import Foundation

/// Launch arguments that make the app deterministic for XCUITests: in-memory repositories, a fixed
/// clock (Wednesday 18 November 2026, 15:00 local time) and optional seeded data.
///
/// - `-uiTesting`: in-memory repositories and the fixed clock, signed out.
/// - `-uiTestingSignedIn`: also signed in as the sample member.
/// - `-uiTestingReservations`: also seeds one upcoming and one past reservation.
/// - `-uiTestingSaved`: also seeds Kōyō as saved.
nonisolated enum UITesting {
    static let flag = "-uiTesting"
    static let signedInFlag = "-uiTestingSignedIn"
    static let reservationsFlag = "-uiTestingReservations"
    static let savedFlag = "-uiTestingSaved"

    static let memberName = "Aarav Mehta"
    static let memberEmail = "aarav@example.com"
    static let memberPassword = "password1"
    static let memberCreatedAt = "2025-03-14T10:00:00Z"

    static let upcomingReservationId = "6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60"
    static let pastReservationId = "0a9b8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d"

    static let fixedDate = LocalDate(year: 2026, month: 11, day: 18)
    static let fixedMinutes = 15 * 60

    static func fixedNow() -> Date {
        fixedDate.date(atMinutes: fixedMinutes)
    }

    static func sampleReservations() -> [Reservation] {
        [
            Reservation(
                id: upcomingReservationId, confirmationCode: "DC-7KQ2MX", restaurantId: "koyo",
                date: "2026-11-20", time: "21:30", partySize: 2, seating: .indoor, occasion: .anniversary,
                dietary: [.vegetarian], notes: "", status: .confirmed,
                createdAt: "2026-11-10T09:00:00Z", updatedAt: "2026-11-10T09:00:00Z"
            ),
            Reservation(
                id: pastReservationId, confirmationCode: "DC-H4PZ9R", restaurantId: "maison-lumiere",
                date: "2026-10-10", time: "20:00", partySize: 4, seating: .window, occasion: .none,
                dietary: [], notes: "", status: .confirmed,
                createdAt: "2026-10-01T09:00:00Z", updatedAt: "2026-10-01T09:00:00Z"
            ),
        ]
    }
}

extension AppContainer {
    static func uiTesting(arguments: [String]) -> AppContainer {
        let now = UITesting.fixedNow
        let signedIn = arguments.contains(UITesting.signedInFlag)
        return preview(
            signedIn: signedIn,
            reservations: arguments.contains(UITesting.reservationsFlag) ? UITesting.sampleReservations() : [],
            saved: arguments.contains(UITesting.savedFlag) ? ["koyo"] : [],
            now: now
        )
    }
}
