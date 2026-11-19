import Foundation
import Observation

/// State and actions for the Task editor, for a new task (`taskId` nil) or an existing one.
@Observable
final class TaskEditorViewModel {
    enum Phase: Equatable { case loading, failed, editing }

    static let titleLimit = 120
    static let notesLimit = 2000

    let taskId: String?
    private(set) var phase: Phase

    var title = "" {
        didSet { titleTouched = true }
    }
    var notes = ""
    var status: TaskStatus = .todo
    var priority: TaskPriority = .medium
    private(set) var hasDueDate = false
    /// Kept when the switch goes off, so turning it back on restores the chosen date.
    var dueDate: Date?

    private(set) var titleTouched = false
    private(set) var isSaving = false
    private(set) var saveFailed = false
    private(set) var didSave = false

    @ObservationIgnored private let repository: any TasksRepository
    @ObservationIgnored private let now: () -> Date

    init(repository: any TasksRepository, taskId: String?, now: @escaping () -> Date = Date.init) {
        self.repository = repository
        self.taskId = taskId
        self.now = now
        phase = taskId == nil ? .editing : .loading
    }

    var isNew: Bool { taskId == nil }

    var navigationTitle: String { isNew ? Strings.taskEditorNewTitle : Strings.taskEditorEditTitle }

    private var trimmedTitle: String { title.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var trimmedNotes: String { notes.trimmingCharacters(in: .whitespacesAndNewlines) }

    var titleError: String? {
        if trimmedTitle.count > Self.titleLimit { return Strings.taskEditorTitleTooLong }
        if titleTouched && trimmedTitle.isEmpty { return Strings.taskEditorTitleRequired }
        return nil
    }

    var notesError: String? {
        trimmedNotes.count > Self.notesLimit ? Strings.taskEditorNotesTooLong : nil
    }

    var canSave: Bool {
        phase == .editing && !isSaving && !trimmedTitle.isEmpty
            && trimmedTitle.count <= Self.titleLimit && trimmedNotes.count <= Self.notesLimit
    }

    /// The date the picker shows: the chosen one, or today.
    var shownDueDate: Date { dueDate ?? now() }

    /// Turning it on picks today's local date unless a date was already chosen.
    func setHasDueDate(_ on: Bool) {
        hasDueDate = on
        if on && dueDate == nil {
            dueDate = Calendar.current.startOfDay(for: now())
        }
    }

    /// Edit only: fills the form with the task's current values.
    func load() async {
        guard let taskId, phase != .editing else { return }
        phase = .loading
        do {
            let task = try await repository.get(id: taskId)
            title = task.title
            notes = task.notes
            status = task.taskStatus
            priority = task.taskPriority
            dueDate = task.dueDate.flatMap { TaskDates.parseDay($0) }
            hasDueDate = dueDate != nil
            titleTouched = false
            phase = .editing
        } catch {
            guard !Task.isCancelled else { return }
            phase = .failed
        }
    }

    var input: TaskInput {
        TaskInput(
            dueDate: hasDueDate ? TaskDates.dayString(shownDueDate) : nil,
            notes: trimmedNotes,
            priority: priority.rawValue,
            status: status.rawValue,
            title: trimmedTitle
        )
    }

    func save() async {
        guard canSave else { return }
        isSaving = true
        saveFailed = false
        defer { isSaving = false }
        do {
            if let taskId {
                _ = try await repository.update(id: taskId, input: input)
            } else {
                _ = try await repository.create(input)
            }
            didSave = true
        } catch {
            saveFailed = true
        }
    }
}
