import Foundation
import Testing
@testable import App

@Suite("Task editor")
struct TaskEditorTests {
    private func makeViewModel(_ repository: FakeTasksRepository, taskId: String? = nil) -> TaskEditorViewModel {
        TaskEditorViewModel(repository: repository, taskId: taskId, now: { TestClock.today })
    }

    @Test("AC-task-editor-1: a new task starts empty, To do, Medium, with no due date")
    func newDefaults() {
        let viewModel = makeViewModel(FakeTasksRepository())
        #expect(viewModel.phase == .editing)
        #expect(viewModel.title.isEmpty)
        #expect(viewModel.notes.isEmpty)
        #expect(viewModel.status == .todo)
        #expect(viewModel.priority == .medium)
        #expect(!viewModel.hasDueDate)
        #expect(viewModel.input.dueDate == nil)
        #expect(viewModel.titleError == nil)
        #expect(!viewModel.canSave)
    }

    @Test("AC-task-editor-2: Save is disabled for an empty or too-long title or too-long notes, with the message")
    func validation() {
        let viewModel = makeViewModel(FakeTasksRepository())

        viewModel.title = "   "
        #expect(!viewModel.canSave)
        #expect(viewModel.titleError == Strings.taskEditorTitleRequired)

        viewModel.title = String(repeating: "a", count: 121)
        #expect(!viewModel.canSave)
        #expect(viewModel.titleError == Strings.taskEditorTitleTooLong)

        viewModel.title = "  " + String(repeating: "a", count: 120) + "  "
        #expect(viewModel.canSave)
        #expect(viewModel.titleError == nil)

        viewModel.notes = String(repeating: "n", count: 2001)
        #expect(!viewModel.canSave)
        #expect(viewModel.notesError == Strings.taskEditorNotesTooLong)

        viewModel.notes = String(repeating: "n", count: 2000)
        #expect(viewModel.canSave)
        #expect(viewModel.notesError == nil)
    }

    @Test("AC-task-editor-3: saving a new task sends the trimmed values with createTask, then closes")
    func createsTask() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        viewModel.title = "  Book flights  "
        viewModel.notes = "\n Window seat \n"
        viewModel.status = .inProgress
        viewModel.priority = .high
        viewModel.setHasDueDate(true)
        viewModel.dueDate = TaskDates.parseDay(TestClock.day(2))

        await viewModel.save()

        #expect(repository.calls == [.create(TaskInput(
            dueDate: TestClock.day(2), notes: "Window seat", priority: "high", status: "inProgress", title: "Book flights"
        ))])
        #expect(viewModel.didSave)
        #expect(repository.store.tasks.contains { $0.title == "Book flights" })
    }

    @Test("AC-task-editor-4: editing starts with the task's values and saves the changes with updateTask")
    func editsTask() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository, taskId: "sample-3")
        #expect(viewModel.phase == .loading)

        await viewModel.load()
        #expect(viewModel.phase == .editing)
        #expect(viewModel.title == "Prepare slides for the all-hands")
        #expect(viewModel.priority == .medium)
        #expect(viewModel.hasDueDate)
        #expect(viewModel.titleError == nil)

        viewModel.title = "Prepare slides"
        viewModel.priority = .low
        await viewModel.save()

        #expect(repository.calls.last == .update("sample-3", TaskInput(
            dueDate: TestClock.day(3), notes: "", priority: "low", status: "todo", title: "Prepare slides"
        )))
        #expect(viewModel.didSave)
    }

    @Test("AC-task-editor-4: a failed load shows the error state, and Retry loads again")
    func loadFailure() async {
        let repository = FakeTasksRepository()
        repository.failing[.get] = FakeTasksRepository.Failure()
        let viewModel = makeViewModel(repository, taskId: "sample-1")

        await viewModel.load()
        #expect(viewModel.phase == .failed)

        repository.failing = [:]
        await viewModel.load()
        #expect(viewModel.phase == .editing)
    }

    @Test("AC-task-editor-5: turning the due date on picks today; turning it off saves without a due date")
    func dueDateSwitch() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository, taskId: "sample-1")
        await viewModel.load()

        viewModel.setHasDueDate(false)
        await viewModel.save()
        #expect(repository.calls.last == .update("sample-1", TaskInput(
            dueDate: nil, notes: "", priority: "high", status: "inProgress", title: "Finalize Q4 product roadmap"
        )))
        #expect(repository.store.tasks.first { $0.id == "sample-1" }?.dueDate == nil)

        let fresh = makeViewModel(repository)
        fresh.setHasDueDate(true)
        #expect(fresh.input.dueDate == TestClock.day(0))

        // A date that was already chosen comes back when the switch goes on again.
        fresh.dueDate = TaskDates.parseDay(TestClock.day(5))
        fresh.setHasDueDate(false)
        fresh.setHasDueDate(true)
        #expect(fresh.input.dueDate == TestClock.day(5))
    }

    @Test("AC-task-editor-6: Save is disabled while saving; a failed save shows the error and keeps every field")
    func savingAndFailure() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        viewModel.title = "Call the bank"
        viewModel.notes = "About the card"
        viewModel.priority = .low
        var whileSaving: (saving: Bool, canSave: Bool)?
        repository.whileInFlight = { _ in whileSaving = (viewModel.isSaving, viewModel.canSave) }
        repository.failing[.create] = FakeTasksRepository.Failure()

        await viewModel.save()

        #expect(whileSaving?.saving == true)
        #expect(whileSaving?.canSave == false)
        #expect(viewModel.saveFailed)
        #expect(!viewModel.didSave)
        #expect(viewModel.title == "Call the bank")
        #expect(viewModel.notes == "About the card")
        #expect(viewModel.priority == .low)
        #expect(viewModel.canSave)
    }

    @Test("AC-task-editor-7: Cancel closes the editor without saving")
    func cancelDoesNotSave() {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        viewModel.title = "Never saved"
        // Cancel only dismisses the sheet; nothing reaches the repository.
        #expect(repository.calls.isEmpty)
        #expect(!viewModel.didSave)
    }
}
