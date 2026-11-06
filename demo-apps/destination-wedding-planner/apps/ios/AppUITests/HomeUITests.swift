import XCTest

/// UI tests launch the built app and drive it the way a user does, by accessibility identifier.
/// They cover acceptance criteria marked (ui): put the criterion's ID in the activity name.
final class HomeUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    func testSettingsEntryOpensSettings() {
        XCTContext.runActivity(named: "AC-home-3: Home has an entry point that opens Settings") { _ in
            let app = XCUIApplication()
            app.launchArguments.append("UI_TESTING")
            app.launchEnvironment["UI_TESTING"] = "1"
            app.launch()

            app.buttons["home.openSettings"].tap()
            XCTAssertTrue(app.descendants(matching: .any)["settings.appearance"].waitForExistence(timeout: 5))

            app.navigationBars.buttons.element(boundBy: 0).tap()
            XCTAssertTrue(app.buttons["home.openSettings"].waitForExistence(timeout: 5))
        }
    }

    @MainActor
    func testExploreDestinationsOpensDestinations() {
        XCTContext.runActivity(named: "AC-home-4: Explore Destinations opens Destinations") { _ in
            let app = XCUIApplication()
            app.launchArguments.append("UI_TESTING")
            app.launchEnvironment["UI_TESTING"] = "1"
            app.launch()

            let explore = app.buttons["home.exploreCta"]
            XCTAssertTrue(explore.waitForExistence(timeout: 5))
            explore.tap()
            XCTAssertTrue(app.descendants(matching: .any)["destinations.list"].waitForExistence(timeout: 5))
        }
    }

    @MainActor
    func testPlanYourWeddingOpensWedding() {
        XCTContext.runActivity(named: "AC-home-5: Plan Your Wedding opens Wedding") { _ in
            let app = XCUIApplication()
            app.launchArguments.append("UI_TESTING")
            app.launchEnvironment["UI_TESTING"] = "1"
            app.launch()

            let plan = app.buttons["home.planCta"]
            XCTAssertTrue(plan.waitForExistence(timeout: 5))
            plan.tap()
            XCTAssertTrue(app.descendants(matching: .any)["wedding.date"].waitForExistence(timeout: 5))
        }
    }

    @MainActor
    func testSubmittingSearchOpensDestinations() {
        XCTContext.runActivity(named: "AC-home-7: Submitting the search panel opens Destinations") { _ in
            let app = XCUIApplication()
            app.launchArguments.append("UI_TESTING")
            app.launchEnvironment["UI_TESTING"] = "1"
            app.launch()

            XCTAssertTrue(app.descendants(matching: .any)["home.search"].waitForExistence(timeout: 5))
            let submit = app.buttons["home.search.submit"]
            if !submit.waitForExistence(timeout: 2) || !submit.isHittable {
                app.swipeUp()
            }
            XCTAssertTrue(submit.waitForExistence(timeout: 5))
            submit.tap()
            XCTAssertTrue(app.descendants(matching: .any)["destinations.list"].waitForExistence(timeout: 5))
        }
    }
}
