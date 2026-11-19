import XCTest

/// UI tests launch the built app with `-uiTesting` (in-memory sample tasks, no network) and drive
/// it the way a user does, by accessibility identifier. Put the criterion's ID in the activity name.
final class TasksUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    func testListsTasksInOrder() {
        XCTContext.runActivity(named: "AC-tasks-1: Tasks lists the tasks in the order received, with title, priority, status and due date") { _ in
            let app = XCUIApplication.launchedForTesting()

            let ids = ["sample-2", "sample-1", "sample-3", "sample-4"]
            let rows = ids.map { app.buttons["tasks.row.\($0)"] }
            XCTAssertTrue(rows[0].waitForExistence(timeout: 10))
            XCTAssertTrue(app.descendants(matching: .any)["tasks.list"].exists)
            XCTAssertTrue(app.staticTexts["tasks.count"].exists)

            for (upper, lower) in zip(rows, rows.dropFirst()) {
                XCTAssertTrue(lower.waitForExistence(timeout: 5))
                XCTAssertLessThan(upper.frame.minY, lower.frame.minY)
            }
            let roadmap = rows[1].label
            XCTAssertTrue(roadmap.contains("Finalize Q4 product roadmap"), roadmap)
            XCTAssertTrue(roadmap.contains("High"), roadmap)
            XCTAssertTrue(roadmap.contains("In progress"), roadmap)
            XCTAssertTrue(roadmap.contains("Due"), roadmap)
            XCTAssertTrue(rows[0].label.contains("Overdue"), rows[0].label)
            XCTAssertFalse(rows[3].label.contains("Due"), rows[3].label)
        }
    }

    @MainActor
    func testToggleMarksDoneAndBack() {
        XCTContext.runActivity(named: "AC-tasks-7: the toggle marks an open task Done, and a Done task To do") { _ in
            let app = XCUIApplication.launchedForTesting()
            let toggle = app.buttons["tasks.row.sample-1.toggle"]
            XCTAssertTrue(toggle.waitForExistence(timeout: 10))
            let openLabel = toggle.label

            toggle.tap()
            XCTAssertTrue(app.buttons["tasks.row.sample-1"].waitForLabel(containing: "Done"))
            XCTAssertNotEqual(toggle.label, openLabel)

            toggle.tap()
            XCTAssertTrue(app.buttons["tasks.row.sample-1"].waitForLabel(containing: "To do"))
            XCTAssertEqual(toggle.label, openLabel)
        }
    }

    @MainActor
    func testRowOpensDetailAndAddOpensEditor() {
        XCTContext.runActivity(named: "AC-tasks-10: a row opens its Task detail, and New task opens the editor") { _ in
            let app = XCUIApplication.launchedForTesting()
            let row = app.buttons["tasks.row.sample-3"]
            XCTAssertTrue(row.waitForExistence(timeout: 10))

            row.tap()
            let title = app.staticTexts["taskDetail.taskTitle"]
            XCTAssertTrue(title.waitForExistence(timeout: 5))
            XCTAssertEqual(title.label, "Prepare slides for the all-hands")

            app.navigationBars.buttons.element(boundBy: 0).tap()
            XCTAssertTrue(app.buttons["tasks.addButton"].waitForExistence(timeout: 5))
            app.buttons["tasks.addButton"].tap()
            XCTAssertTrue(app.textFields["taskEditor.titleField"].waitForExistence(timeout: 5))
            XCTAssertTrue(app.buttons["taskEditor.cancelButton"].exists)
        }
    }

    @MainActor
    func testSettingsEntryOpensSettings() {
        XCTContext.runActivity(named: "AC-tasks-11: Tasks has an entry point that opens Settings") { _ in
            let app = XCUIApplication.launchedForTesting()
            let gear = app.buttons["tasks.openSettings"]
            XCTAssertTrue(gear.waitForExistence(timeout: 10))

            gear.tap()
            XCTAssertTrue(app.descendants(matching: .any)["settings.appearance"].waitForExistence(timeout: 5))
            XCTAssertTrue(app.descendants(matching: .any)["settings.server"].exists)

            app.navigationBars.buttons.element(boundBy: 0).tap()
            XCTAssertTrue(gear.waitForExistence(timeout: 5))
        }
    }
}

extension XCUIApplication {
    /// The app with in-memory sample tasks, so tests never need the network.
    @MainActor
    static func launchedForTesting() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTesting"]
        app.launch()
        return app
    }
}

extension XCUIElement {
    @MainActor
    func waitForLabel(containing text: String, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "label CONTAINS %@", text)
        return XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: self)], timeout: timeout) == .completed
    }
}
