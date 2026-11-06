import XCTest

final class VenuesUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    func testSubmittingEnquiryShowsSuccess() {
        XCTContext.runActivity(named: "AC-venues-4: Submitting a valid enquiry shows the success message") { _ in
            let app = XCUIApplication()
            app.launchArguments.append("UI_TESTING")
            app.launchEnvironment["UI_TESTING"] = "1"
            app.launch()

            let venuesTab = app.tabBars.buttons["Venues"]
            XCTAssertTrue(venuesTab.waitForExistence(timeout: 5))
            venuesTab.tap()

            let list = app.descendants(matching: .any)["venues.list"]
            XCTAssertTrue(list.waitForExistence(timeout: 5))
            let card = app.descendants(matching: .any)["venues.card.udaipur-taj-lake"]
            if !card.waitForExistence(timeout: 2) {
                app.swipeUp()
            }
            XCTAssertTrue(card.waitForExistence(timeout: 5))
            card.tap()

            let enquire = app.buttons["venues.enquireCta"]
            XCTAssertTrue(enquire.waitForExistence(timeout: 5))
            enquire.tap()

            let form = app.descendants(matching: .any)["venues.enquireForm"]
            XCTAssertTrue(form.waitForExistence(timeout: 5))

            let name = app.textFields.element(boundBy: 0)
            name.tap()
            name.typeText("Meera and Arjun")

            let email = app.textFields.element(boundBy: 1)
            email.tap()
            email.typeText("couple@example.com")

            let message = app.textFields.element(boundBy: app.textFields.count - 1)
            message.tap()
            message.typeText("A palace wedding in winter.")

            let submit = app.buttons["venues.enquireSubmit"]
            if !submit.isHittable {
                app.swipeUp()
            }
            submit.tap()

            XCTAssertTrue(app.descendants(matching: .any)["venues.enquireSuccess"].waitForExistence(timeout: 5))
        }
    }
}
