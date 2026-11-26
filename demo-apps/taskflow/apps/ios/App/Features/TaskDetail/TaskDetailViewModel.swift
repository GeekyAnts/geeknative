import Foundation
import Observation

/// State and actions for the Task detail screen.
@Observable
final class TaskDetailViewModel {
    enum Phase: Equatable { case loading, failed, notFound, loaded }
    enum Failure: Equatable { case update, delete }

    let taskId: String
    private(set) var task: TaskItem?
    private(set) var phase: Phase = .loading
    /// A status change or delete is in flight.
    private(set) var isBusy = false
    private(set) var didDelete = false
    var failure: Failure?

    @ObservationIgnored private let repository: any TasksRepository
    @ObservationIgnored private let now: () -> Date

    init(repository: any TasksRepository, taskId: String, now: @escaping () -> Date = Date.init) {
        self.repository = repository
        self.taskId = taskId
        self.now = now
    }

    /// Loads the task. The current task stays visible while it reloads.
    func load() async {
        if task == nil { phase = .loading }
        do {
            task = try await repository.get(id: taskId)
            phase = .loaded
        } catch TasksError.notFound {
            task = nil
            phase = .notFound
        } catch {
            guard !Task.isCancelled else { return }
            if task == nil { phase = .failed }
        }
    }

    /// Shows the new status at once and saves it; puts the previous one back if saving fails.
    func setStatus(_ status: TaskStatus) async {
        guard let previous = task, previous.taskStatus != status, !isBusy else { return }
        task?.status = status.rawValue
        isBusy = true
        defer { isBusy = false }
        do {
            task = try await repository.updateStatus(id: taskId, status: status)
        } catch {
            task = previous
            failure = .update
        }
    }

    func delete() async {
        guard !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            try await repository.delete(id: taskId)
            didDelete = true
        } catch {
            failure = .delete
        }
    }

    var failureMessage: String {
        failure == .delete ? Strings.taskDetailDeleteError : Strings.taskDetailUpdateError
    }

    var isOverdue: Bool {
        guard let task else { return false }
        return TaskDates.isOverdue(dueDate: task.dueDate, status: task.taskStatus, today: now())
    }

    var dueDateText: String {
        task?.dueDate.flatMap(TaskDates.longDay) ?? Strings.taskDetailNoDueDate
    }

    var hasNotes: Bool { !(task?.notes.isEmpty ?? true) }

    var notesText: String {
        hasNotes ? task?.notes ?? "" : Strings.taskDetailNoNotes
    }

    var createdText: String {
        Strings.taskDetailCreated(date: TaskDates.dateTime(task?.createdAt ?? ""))
    }

    var updatedText: String {
        Strings.taskDetailUpdated(date: TaskDates.dateTime(task?.updatedAt ?? ""))
    }
}
