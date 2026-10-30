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
            app.launch()

            app.buttons["home.openSettings"].tap()
            XCTAssertTrue(app.descendants(matching: .any)["settings.appearance"].waitForExistence(timeout: 5))

            // Back returns to Home.
            app.navigationBars.buttons.element(boundBy: 0).tap()
            XCTAssertTrue(app.buttons["home.openSettings"].waitForExistence(timeout: 5))
        }
    }
}
