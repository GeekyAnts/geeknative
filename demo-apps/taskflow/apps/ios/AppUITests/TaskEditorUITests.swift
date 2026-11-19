import XCTest

final class TaskEditorUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    private func openNewTask(in app: XCUIApplication) {
        let add = app.buttons["tasks.addButton"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.tap()
        XCTAssertTrue(app.textFields["taskEditor.titleField"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testNewTaskDefaults() {
        XCTContext.runActivity(named: "AC-task-editor-1: New task opens with an empty title, To do, Medium and no due date") { _ in
            let app = XCUIApplication.launchedForTesting()
            openNewTask(in: app)

            let title = app.textFields["taskEditor.titleField"]
            let value = title.value as? String
            XCTAssertTrue(value == nil || value == "" || value == title.placeholderValue, String(describing: value))
            XCTAssertTrue(app.segmentedControls["taskEditor.status"].buttons["To do"].isSelected)
            XCTAssertTrue(app.segmentedControls["taskEditor.priority"].buttons["Medium"].isSelected)
            XCTAssertEqual(app.switches["taskEditor.dueDateToggle"].value as? String, "0")
            XCTAssertFalse(app.buttons["taskEditor.saveButton"].isEnabled)
        }
    }

    @MainActor
    func testCancelClosesWithoutSaving() {
        XCTContext.runActivity(named: "AC-task-editor-7: Cancel closes the editor without saving") { _ in
            let app = XCUIApplication.launchedForTesting()
            openNewTask(in: app)

            let title = app.textFields["taskEditor.titleField"]
            title.tap()
            title.typeText("Never saved")
            XCTAssertTrue(app.buttons["taskEditor.saveButton"].isEnabled)

            app.buttons["taskEditor.cancelButton"].tap()
            XCTAssertTrue(title.waitForNonExistence(timeout: 5))
            XCTAssertTrue(app.buttons["tasks.row.sample-1"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons.containing(NSPredicate(format: "label CONTAINS %@", "Never saved")).firstMatch.exists)
        }
    }
}
