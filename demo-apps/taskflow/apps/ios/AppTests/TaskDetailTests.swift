import Foundation
import Testing
@testable import App

@Suite("Task detail")
struct TaskDetailTests {
    private func makeViewModel(_ repository: FakeTasksRepository, taskId: String = "sample-1") -> TaskDetailViewModel {
        TaskDetailViewModel(repository: repository, taskId: taskId, now: { TestClock.today })
    }

    @Test("AC-task-detail-1: shows title, status, priority, due date or No due date, notes or No notes, and dates")
    func showsTask() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()

        #expect(repository.calls == [.get("sample-1")])
        #expect(viewModel.phase == .loaded)
        #expect(viewModel.task?.title == "Finalize Q4 product roadmap")
        #expect(viewModel.task?.taskStatus == .inProgress)
        #expect(viewModel.task?.taskPriority == .high)
        #expect(viewModel.dueDateText == TaskDates.longDay(TestClock.day(1)))
        #expect(!viewModel.isOverdue)
        #expect(viewModel.notesText == Strings.taskDetailNoNotes)
        #expect(!viewModel.hasNotes)
        #expect(viewModel.createdText.hasPrefix(Strings.taskDetailCreated(date: "")))
        #expect(viewModel.createdText != Strings.taskDetailCreated(date: viewModel.task!.createdAt))
        #expect(viewModel.updatedText.hasPrefix(Strings.taskDetailUpdated(date: "")))

        let done = makeViewModel(repository, taskId: "sample-4")
        await done.load()
        #expect(done.dueDateText == Strings.taskDetailNoDueDate)

        let overdue = makeViewModel(repository, taskId: "sample-2")
        await overdue.load()
        #expect(overdue.isOverdue)

        _ = try? await repository.update(id: "sample-3", input: TaskInput(dueDate: nil, notes: "Ten slides", priority: "medium", status: "todo", title: "Slides"))
        let withNotes = makeViewModel(repository, taskId: "sample-3")
        await withNotes.load()
        #expect(withNotes.notesText == "Ten slides")
    }

    @Test("AC-task-detail-2: choosing a status saves it and shows the returned task; on failure the previous comes back")
    func changesStatus() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()
        var whileSaving: (TaskStatus?, Bool)?
        repository.whileInFlight = { _ in whileSaving = (viewModel.task?.taskStatus, viewModel.isBusy) }

        await viewModel.setStatus(.done)
        #expect(whileSaving?.0 == .done)
        #expect(whileSaving?.1 == true)
        #expect(repository.calls.last == .updateStatus("sample-1", .done))
        #expect(viewModel.task == repository.store.tasks.first { $0.id == "sample-1" })
        #expect(viewModel.task?.updatedAt == TaskDates.timestamp(TestClock.today))
        #expect(!viewModel.isBusy)

        repository.failing[.updateStatus] = FakeTasksRepository.Failure()
        await viewModel.setStatus(.todo)
        #expect(viewModel.task?.taskStatus == .done)
        #expect(viewModel.failure == .update)
        #expect(viewModel.failureMessage == Strings.taskDetailUpdateError)
    }

    @Test("AC-task-detail-3: confirming delete calls deleteTask and returns to Tasks without the task")
    func deletes() async throws {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository, taskId: "sample-3")
        await viewModel.load()

        await viewModel.delete()

        #expect(repository.calls.last == .delete("sample-3"))
        #expect(viewModel.didDelete)
        let remaining = try await repository.list(filter: TaskFilter())
        #expect(!remaining.contains { $0.id == "sample-3" })
    }

    @Test("AC-task-detail-4: loading, then the error state with Retry, and a 404 shows not found")
    func loadStates() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        var phaseWhileLoading: TaskDetailViewModel.Phase?
        repository.whileInFlight = { _ in phaseWhileLoading = viewModel.phase }
        repository.failing[.get] = FakeTasksRepository.Failure()

        await viewModel.load()
        #expect(phaseWhileLoading == .loading)
        #expect(viewModel.phase == .failed)

        repository.failing = [:]
        await viewModel.load()
        #expect(viewModel.phase == .loaded)

        let missing = makeViewModel(repository, taskId: "missing")
        await missing.load()
        #expect(missing.phase == .notFound)
    }

    @Test("AC-task-detail-5: Edit opens the editor filled in with this task")
    func editOpensFilledEditor() async {
        let repository = FakeTasksRepository()
        let editor = TaskEditorViewModel(repository: repository, taskId: "sample-2", now: { TestClock.today })
        await editor.load()
        #expect(editor.navigationTitle == Strings.taskEditorEditTitle)
        #expect(editor.title == "Fix crash when uploading large attachments")
        #expect(editor.status == .todo)
        #expect(editor.priority == .high)
        #expect(editor.hasDueDate)
        #expect(editor.dueDate.map { TaskDates.dayString($0) } == TestClock.day(-1))
    }

    @Test("AC-task-detail-6: when deleting fails, the user stays and taskDetail.deleteError shows")
    func deleteFailure() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()
        repository.failing[.delete] = FakeTasksRepository.Failure()

        await viewModel.delete()

        #expect(!viewModel.didDelete)
        #expect(viewModel.failure == .delete)
        #expect(viewModel.failureMessage == Strings.taskDetailDeleteError)
        #expect(viewModel.phase == .loaded)
        #expect(!viewModel.isBusy)
    }
}
