import XCTest

final class TaskDetailUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    @MainActor
    private func openDetail(_ taskId: String, in app: XCUIApplication) {
        let row = app.buttons["tasks.row.\(taskId)"]
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        row.tap()
        XCTAssertTrue(app.staticTexts["taskDetail.taskTitle"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testShowsTask() {
        XCTContext.runActivity(named: "AC-task-detail-1: Task detail shows title, status, priority, due date, notes and dates") { _ in
            let app = XCUIApplication.launchedForTesting()
            openDetail("sample-2", in: app)

            let any = app.descendants(matching: .any)
            XCTAssertEqual(app.staticTexts["taskDetail.taskTitle"].label, "Fix crash when uploading large attachments")
            XCTAssertTrue(app.segmentedControls["taskDetail.status"].buttons["To do"].isSelected)
            XCTAssertTrue(any["taskDetail.priority"].label.contains("High"))
            XCTAssertTrue(any["taskDetail.dueDate"].label.contains("Overdue"))
            XCTAssertEqual(app.staticTexts["taskDetail.notes"].label, "No notes")
            XCTAssertTrue(app.staticTexts["taskDetail.created"].label.hasPrefix("Created"))
            XCTAssertTrue(app.staticTexts["taskDetail.updated"].label.hasPrefix("Updated"))

            app.navigationBars.buttons.element(boundBy: 0).tap()
            openDetail("sample-4", in: app)
            XCTAssertTrue(any["taskDetail.dueDate"].label.contains("No due date"))
        }
    }

    @MainActor
    func testDeleteAsksFirst() {
        XCTContext.runActivity(named: "AC-task-detail-3: Delete asks first; cancelling keeps the task, confirming deletes it") { _ in
            let app = XCUIApplication.launchedForTesting()
            openDetail("sample-3", in: app)

            // Cancel: dismiss the dialog (a popover on iOS 26 and later) by tapping outside it.
            app.buttons["taskDetail.deleteButton"].tap()
            XCTAssertTrue(app.buttons["taskDetail.confirmDelete"].firstMatch.waitForExistence(timeout: 5))
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.1)).tap()
            XCTAssertTrue(app.buttons["taskDetail.confirmDelete"].firstMatch.waitForNonExistence(timeout: 5))
            XCTAssertTrue(app.staticTexts["taskDetail.taskTitle"].exists)

            app.buttons["taskDetail.deleteButton"].tap()
            let confirm = app.buttons["taskDetail.confirmDelete"].firstMatch
            XCTAssertTrue(confirm.waitForExistence(timeout: 5))
            confirm.tap()

            XCTAssertTrue(app.buttons["tasks.row.sample-1"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["tasks.row.sample-3"].exists)
        }
    }

    @MainActor
    func testEditOpensFilledEditor() {
        XCTContext.runActivity(named: "AC-task-detail-5: Edit opens the Task editor filled in with this task") { _ in
            let app = XCUIApplication.launchedForTesting()
            openDetail("sample-1", in: app)

            app.buttons["taskDetail.editButton"].tap()
            let title = app.textFields["taskEditor.titleField"]
            XCTAssertTrue(title.waitForExistence(timeout: 5))
            XCTAssertEqual(title.value as? String, "Finalize Q4 product roadmap")
            XCTAssertTrue(app.segmentedControls["taskEditor.status"].buttons["In progress"].isSelected)
            XCTAssertTrue(app.segmentedControls["taskEditor.priority"].buttons["High"].isSelected)
            XCTAssertEqual(app.switches["taskEditor.dueDateToggle"].value as? String, "1")
        }
    }
}
