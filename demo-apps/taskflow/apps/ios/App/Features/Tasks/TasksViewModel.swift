import Foundation
import Observation

/// State and actions for the Tasks screen.
@Observable
final class TasksViewModel {
    enum Phase: Equatable { case loading, failed, loaded }
    enum Content: Equatable { case loading, error, empty, emptyFiltered, list }

    private(set) var tasks: [TaskItem] = []
    private(set) var phase: Phase = .loading
    /// Changing it doesn't load by itself; the screen loads whenever it changes.
    var filter = TaskFilter()
    var showsUpdateError = false

    @ObservationIgnored private let repository: any TasksRepository
    @ObservationIgnored private let now: () -> Date

    init(repository: any TasksRepository, now: @escaping () -> Date = Date.init) {
        self.repository = repository
        self.now = now
    }

    var content: Content {
        switch phase {
        case .loading: .loading
        case .failed: .error
        case .loaded where tasks.isEmpty: filter.isActive ? .emptyFiltered : .empty
        case .loaded: .list
        }
    }

    var countText: String { Strings.tasksCount(count: tasks.count) }

    /// Loads with the current filter. The rows stay visible while a later load runs.
    func load() async {
        if phase != .loaded { phase = .loading }
        do {
            let loaded = try await repository.list(filter: filter)
            guard !Task.isCancelled else { return }
            tasks = loaded
            phase = .loaded
        } catch {
            guard !Task.isCancelled else { return }
            phase = .failed
        }
    }

    func clearFilters() {
        filter = TaskFilter()
    }

    /// Marks an open task Done, or a Done task To do, at once, and puts it back if saving fails.
    func toggle(_ task: TaskItem) async {
        guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        let previous = tasks[index]
        let next = previous.taskStatus.toggled
        tasks[index].status = next.rawValue
        do {
            let saved = try await repository.updateStatus(id: task.id, status: next)
            if let i = tasks.firstIndex(where: { $0.id == task.id }) { tasks[i] = saved }
        } catch {
            if let i = tasks.firstIndex(where: { $0.id == task.id }) { tasks[i] = previous }
            showsUpdateError = true
        }
    }

    func isOverdue(_ task: TaskItem) -> Bool {
        TaskDates.isOverdue(dueDate: task.dueDate, status: task.taskStatus, today: now())
    }

    func dueText(_ task: TaskItem) -> String? {
        task.dueDate.flatMap(TaskDates.mediumDay).map { Strings.taskDue(date: $0) }
    }
}
