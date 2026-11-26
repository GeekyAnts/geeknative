import Foundation
import Testing
@testable import App

@Suite("Tasks")
struct TasksTests {
    private func makeViewModel(_ repository: FakeTasksRepository = FakeTasksRepository()) -> TasksViewModel {
        TasksViewModel(repository: repository, now: { TestClock.today })
    }

    @Test("AC-tasks-1: lists the server's tasks in the order received, with title, priority, status and due date")
    func listsInServerOrder() async {
        // The fake returns them in an order the client would never produce by sorting itself.
        let tasks = TaskSamples.make(today: TestClock.today).reversed()
        let repository = FakeTasksRepository()
        let viewModel = TasksViewModel(repository: ReorderingRepository(base: repository, tasks: Array(tasks)), now: { TestClock.today })

        await viewModel.load()

        #expect(viewModel.content == .list)
        #expect(viewModel.tasks.map(\.id) == ["sample-4", "sample-3", "sample-2", "sample-1"])
        let roadmap = viewModel.tasks.first { $0.id == "sample-1" }!
        #expect(roadmap.title == "Finalize Q4 product roadmap")
        #expect(roadmap.taskPriority == .high)
        #expect(roadmap.taskStatus == .inProgress)
        #expect(viewModel.dueText(roadmap) == Strings.taskDue(date: TaskDates.mediumDay(TestClock.day(1))!))
        #expect(viewModel.dueText(viewModel.tasks.first { $0.id == "sample-4" }!) == nil)
    }

    @Test("AC-tasks-1: the in-memory repository orders tasks the way the server does")
    func inMemoryServerOrder() async throws {
        let tasks = try await InMemoryTasksRepository(tasks: TaskSamples.make(today: TestClock.today)).list(filter: TaskFilter())
        #expect(tasks.map(\.id) == ["sample-2", "sample-1", "sample-3", "sample-4"])
    }

    @Test("AC-tasks-2: shows loading during the first load, the error state on failure, and Retry loads again")
    func loadingErrorRetry() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        var contentWhileLoading: TasksViewModel.Content?
        repository.whileInFlight = { _ in contentWhileLoading = viewModel.content }
        repository.failing[.list] = FakeTasksRepository.Failure()

        await viewModel.load()
        #expect(contentWhileLoading == .loading)
        #expect(viewModel.content == .error)

        repository.failing = [:]
        await viewModel.load()
        #expect(contentWhileLoading == .loading)
        #expect(viewModel.content == .list)
        #expect(viewModel.tasks.count == 4)
    }

    @Test("AC-tasks-2: a later load keeps the rows visible")
    func laterLoadKeepsRows() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()
        var contentWhileLoading: TasksViewModel.Content?
        repository.whileInFlight = { _ in contentWhileLoading = viewModel.content }

        await viewModel.load()

        #expect(contentWhileLoading == .list)
    }

    @Test("AC-tasks-3: with no tasks and no filter, the empty state shows")
    func emptyState() async {
        let viewModel = makeViewModel(FakeTasksRepository(tasks: []))
        await viewModel.load()
        #expect(viewModel.content == .empty)
    }

    @Test("AC-tasks-4: a status filter requests only that status; All requests every status")
    func statusFilter() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)

        viewModel.filter.status = .todo
        await viewModel.load()
        #expect(repository.calls.last == .list(TaskFilter(status: .todo)))
        #expect(viewModel.tasks.map(\.id) == ["sample-2", "sample-3"])

        viewModel.filter.status = nil
        await viewModel.load()
        #expect(repository.calls.last == .list(TaskFilter()))
        #expect(viewModel.tasks.count == 4)
    }

    @Test("AC-tasks-5: a priority filter requests only that priority, combined with the status filter")
    func priorityFilter() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)

        viewModel.filter.priority = .high
        await viewModel.load()
        #expect(repository.calls.last == .list(TaskFilter(priority: .high)))
        #expect(viewModel.tasks.map(\.id) == ["sample-2", "sample-1"])

        viewModel.filter.status = .inProgress
        await viewModel.load()
        #expect(repository.calls.last == .list(TaskFilter(status: .inProgress, priority: .high)))
        #expect(viewModel.tasks.map(\.id) == ["sample-1"])
    }

    @Test("AC-tasks-6: a filter that matches nothing shows filtered-empty; Clear filters shows every task")
    func filteredEmptyAndClear() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)

        viewModel.filter = TaskFilter(status: .done, priority: .high)
        await viewModel.load()
        #expect(viewModel.content == .emptyFiltered)

        viewModel.clearFilters()
        #expect(viewModel.filter == TaskFilter())
        await viewModel.load()
        #expect(repository.calls.last == .list(TaskFilter()))
        #expect(viewModel.content == .list)
        #expect(viewModel.tasks.count == 4)
    }

    @Test("AC-tasks-7: the toggle marks an open task Done and a Done task To do, at once, with updateTaskStatus")
    func toggle() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()
        var statusWhileSaving: TaskStatus?
        repository.whileInFlight = { _ in statusWhileSaving = viewModel.tasks.first { $0.id == "sample-1" }?.taskStatus }

        await viewModel.toggle(viewModel.tasks.first { $0.id == "sample-1" }!)
        #expect(statusWhileSaving == .done)
        #expect(repository.calls.last == .updateStatus("sample-1", .done))
        #expect(viewModel.tasks.first { $0.id == "sample-1" }?.taskStatus == .done)

        await viewModel.toggle(viewModel.tasks.first { $0.id == "sample-4" }!)
        #expect(repository.calls.last == .updateStatus("sample-4", .todo))
        #expect(viewModel.tasks.first { $0.id == "sample-4" }?.taskStatus == .todo)
    }

    @Test("AC-tasks-8: when saving a toggle fails, the row goes back and tasks.updateError shows")
    func toggleFailure() async {
        let repository = FakeTasksRepository()
        let viewModel = makeViewModel(repository)
        await viewModel.load()
        repository.failing[.updateStatus] = FakeTasksRepository.Failure()

        await viewModel.toggle(viewModel.tasks.first { $0.id == "sample-2" }!)

        #expect(viewModel.tasks.first { $0.id == "sample-2" }?.taskStatus == .todo)
        #expect(viewModel.showsUpdateError)
        #expect(!Strings.tasksUpdateError.isEmpty && Strings.tasksUpdateError != "tasks.updateError")
    }

    @Test("AC-tasks-9: an open task due before today is overdue; Done, today or later are not")
    func overdue() async {
        let viewModel = makeViewModel()
        func task(due: String?, status: TaskStatus) -> TaskItem {
            TaskItem(createdAt: "", dueDate: due, id: "x", notes: "", priority: "low", status: status.rawValue, title: "x", updatedAt: "")
        }
        #expect(viewModel.isOverdue(task(due: TestClock.day(-1), status: .todo)))
        #expect(viewModel.isOverdue(task(due: TestClock.day(-30), status: .inProgress)))
        #expect(!viewModel.isOverdue(task(due: TestClock.day(-1), status: .done)))
        #expect(!viewModel.isOverdue(task(due: TestClock.day(0), status: .todo)))
        #expect(!viewModel.isOverdue(task(due: TestClock.day(1), status: .todo)))
        #expect(!viewModel.isOverdue(task(due: nil, status: .todo)))

        await viewModel.load()
        #expect(viewModel.tasks.filter(viewModel.isOverdue).map(\.id) == ["sample-2"])
    }

    @Test("AC-tasks-9: due dates parse as local calendar dates, not UTC midnight")
    func localDates() throws {
        for zone in ["Pacific/Honolulu", "Asia/Kolkata", "Pacific/Kiritimati"] {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = try #require(TimeZone(identifier: zone))
            let date = try #require(TaskDates.parseDay("2026-11-19", calendar: calendar))
            let parts = calendar.dateComponents([.year, .month, .day], from: date)
            #expect(parts.year == 2026 && parts.month == 11 && parts.day == 19)
            #expect(TaskDates.dayString(date, calendar: calendar) == "2026-11-19")
        }
        #expect(TaskDates.parseDay("2026-02-30") == nil)
        #expect(TaskDates.parseDay("nope") == nil)
    }

    @Test("AC-tasks-10: rows open Task detail and New task opens the editor for a new task")
    func navigationTargets() {
        #expect(Route.taskDetail("sample-1") != Route.taskDetail("sample-2"))
        let editor = TaskEditorViewModel(repository: FakeTasksRepository(), taskId: nil)
        #expect(editor.isNew)
        #expect(editor.navigationTitle == Strings.taskEditorNewTitle)
    }

    @Test("AC-tasks-11: Tasks has an entry point that opens Settings")
    func settingsRoute() {
        #expect(LaunchOptions(arguments: ["-screenshotScreen", "settings"]).initialPath == [.settings])
        #expect(Strings.tasksOpenSettings != "tasks.openSettings")
    }

    @Test("AC-tasks-12: the count caption shows the number of tasks in the list")
    func countCaption() async {
        let viewModel = makeViewModel()
        await viewModel.load()
        #expect(viewModel.countText == Strings.tasksCount(count: 4))
        #expect(viewModel.countText.contains("4"))

        viewModel.filter.status = .done
        await viewModel.load()
        #expect(viewModel.countText == Strings.tasksCount(count: 1))
        #expect(viewModel.countText.contains("1"))
    }
}

/// Returns tasks in a fixed order, to show the list keeps the order it receives.
private final class ReorderingRepository: TasksRepository {
    let base: FakeTasksRepository
    let tasks: [TaskItem]

    init(base: FakeTasksRepository, tasks: [TaskItem]) {
        self.base = base
        self.tasks = tasks
    }

    func list(filter: TaskFilter) async throws -> [TaskItem] { tasks }
    func get(id: String) async throws -> TaskItem { try await base.get(id: id) }
    func create(_ input: TaskInput) async throws -> TaskItem { try await base.create(input) }
    func update(id: String, input: TaskInput) async throws -> TaskItem { try await base.update(id: id, input: input) }
    func updateStatus(id: String, status: TaskStatus) async throws -> TaskItem { try await base.updateStatus(id: id, status: status) }
    func delete(id: String) async throws { try await base.delete(id: id) }
}
