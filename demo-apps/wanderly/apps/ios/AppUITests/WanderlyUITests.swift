import XCTest

/// UI tests launch the built app and drive it the way a user does, by accessibility identifier.
/// They cover acceptance criteria marked (ui): put the criterion's ID in the activity name.
final class WanderlyUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
        executionTimeAllowance = 120
    }

    @MainActor
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 20))
        XCTAssertTrue(app.textFields["home.search"].waitForExistence(timeout: 15), "Home search field did not appear")
        return app
    }

    @MainActor
    private func query(_ identifier: String, in app: XCUIApplication) -> XCUIElement {
        let button = app.buttons[identifier].firstMatch
        if button.exists { return button }
        return app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    @MainActor
    private func tap(_ identifier: String, in app: XCUIApplication, timeout: TimeInterval = 6) {
        let target = query(identifier, in: app)
        var swipes = 0
        while !target.exists && swipes < 5 {
            app.swipeUp()
            swipes += 1
        }
        XCTAssertTrue(target.waitForExistence(timeout: timeout), "Missing \(identifier)")
        swipes = 0
        while target.exists && !target.isHittable && swipes < 4 {
            app.swipeUp()
            swipes += 1
        }
        if target.isHittable {
            target.tap()
        } else {
            target.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
    }

    @MainActor
    private func popToTabRoot(in app: XCUIApplication) {
        for _ in 0..<8 {
            if app.tabBars.firstMatch.exists { return }
            let back = app.navigationBars.buttons.element(boundBy: 0)
            if back.exists { back.tap() } else { return }
        }
    }

    @MainActor
    private func tapFirst(prefix: String, in app: XCUIApplication) {
        let target = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH %@", prefix)
        ).firstMatch
        var swipes = 0
        while !target.exists && swipes < 6 {
            app.swipeUp()
            swipes += 1
        }
        XCTAssertTrue(target.waitForExistence(timeout: 6), "Missing \(prefix)")
        swipes = 0
        while target.exists && !target.isHittable && swipes < 4 {
            app.swipeUp()
            swipes += 1
        }
        if target.isHittable {
            target.tap()
        } else {
            target.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
    }

    @MainActor
    func testFeaturedOpensCityDetails() {
        XCTContext.runActivity(named: "AC-home-3: Tapping the featured destination or a trending destination opens City details") { _ in
            let app = launch()
            tap("home.featured", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testCategoryOpensExplore() {
        XCTContext.runActivity(named: "AC-home-6: Tapping a category opens Explore with that category selected") { _ in
            let app = launch()
            tap("home.category.beaches", in: app)
            XCTAssertTrue(query("explore.search", in: app).waitForExistence(timeout: 6))
            XCTAssertTrue(query("explore.category.beaches", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testExploreDestinationOpensCity() {
        XCTContext.runActivity(named: "AC-explore-3: Tapping a destination opens City details") { _ in
            let app = launch()
            app.tabBars.buttons.element(boundBy: 1).tap()
            tap("explore.destination.paris", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testPlanTripOpensPlanner() {
        XCTContext.runActivity(named: "AC-city-details-4: Plan a Trip opens Trip planner with this destination selected") { _ in
            let app = launch()
            tap("home.featured", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
            tap("city.planTrip", in: app)
            XCTAssertTrue(query("planner.generate", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testCityPlaceOpensPlaceDetails() {
        XCTContext.runActivity(named: "AC-city-details-5: Tapping a place opens Place details") { _ in
            let app = launch()
            tap("home.featured", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
            tap("city.place.bali-tegalalang", in: app)
            XCTAssertTrue(query("place.hero", in: app).waitForExistence(timeout: 8))
        }
    }

    @MainActor
    func testAddToTripOpensPlannerWhenEmpty() {
        XCTContext.runActivity(named: "AC-place-details-3: Add to Trip either lists matching trips or opens Trip planner for this destination") { _ in
            let app = launch()
            tap("home.popular.paris-eiffel", in: app)
            XCTAssertTrue(query("place.hero", in: app).waitForExistence(timeout: 6))
            tap("place.addToTrip", in: app)
            XCTAssertTrue(query("place.startTrip", in: app).waitForExistence(timeout: 6))
            tap("place.startTrip", in: app)
            XCTAssertTrue(query("planner.generate", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testGenerateOpensItinerary() {
        XCTContext.runActivity(named: "AC-trip-planner-4: Generate opens the Itinerary screen for the new trip") { _ in
            let app = launch()
            tap("home.featured", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
            tap("city.planTrip", in: app)
            tap("planner.generate", in: app)
            XCTAssertTrue(query("itinerary.hero", in: app).waitForExistence(timeout: 8))
        }
    }

    @MainActor
    func testOpeningTripShowsItinerary() {
        XCTContext.runActivity(named: "AC-my-trips-2: Opening a trip shows its itinerary") { _ in
            let app = launch()
            tap("home.featured", in: app)
            tap("city.planTrip", in: app)
            tap("planner.generate", in: app)
            XCTAssertTrue(query("itinerary.hero", in: app).waitForExistence(timeout: 8))
            popToTabRoot(in: app)
            XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 6))
            app.tabBars.buttons.element(boundBy: 2).tap()
            tap("trips.segment.drafts", in: app)
            tapFirst(prefix: "trips.card.", in: app)
            XCTAssertTrue(query("itinerary.hero", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testSavedDestinationOpensCity() {
        XCTContext.runActivity(named: "AC-saved-4: Opening a saved destination shows City details") { _ in
            let app = launch()
            tap("home.featured", in: app)
            tap("city.save", in: app)
            app.navigationBars.buttons.element(boundBy: 0).tap()
            app.tabBars.buttons.element(boundBy: 3).tap()
            tap("saved.destination.bali", in: app)
            XCTAssertTrue(query("city.hero", in: app).waitForExistence(timeout: 6))
        }
    }

    @MainActor
    func testProfileOpensSettings() {
        XCTContext.runActivity(named: "AC-profile-3: The Settings entry opens Settings") { _ in
            let app = launch()
            app.tabBars.buttons.element(boundBy: 4).tap()
            tap("profile.openSettings", in: app)
            XCTAssertTrue(query("settings.appearance", in: app).waitForExistence(timeout: 6))
        }
    }
}
