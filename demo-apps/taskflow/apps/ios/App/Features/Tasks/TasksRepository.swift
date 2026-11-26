import Foundation

nonisolated enum TasksError: Error, Equatable {
    /// The server answered 404: the task doesn't exist (anymore).
    case notFound
}

/// Reads and writes tasks. Screens use whichever implementation AppContainer provides.
protocol TasksRepository: AnyObject {
    func list(filter: TaskFilter) async throws -> [TaskItem]
    func get(id: String) async throws -> TaskItem
    func create(_ input: TaskInput) async throws -> TaskItem
    func update(id: String, input: TaskInput) async throws -> TaskItem
    func updateStatus(id: String, status: TaskStatus) async throws -> TaskItem
    func delete(id: String) async throws
}

/// Talks to the Taskflow server at `AppConfig.apiBaseUrl` through the generated `ApiClient`.
final class ApiTasksRepository: TasksRepository {
    func list(filter: TaskFilter) async throws -> [TaskItem] {
        try await call { try await ApiClient.listTasks(status: filter.status?.rawValue, priority: filter.priority?.rawValue) }
    }

    func get(id: String) async throws -> TaskItem {
        try await call { try await ApiClient.getTask(taskId: id) }
    }

    func create(_ input: TaskInput) async throws -> TaskItem {
        try await call { try await ApiClient.createTask(body: input) }
    }

    func update(id: String, input: TaskInput) async throws -> TaskItem {
        try await call { try await ApiClient.updateTask(taskId: id, body: input) }
    }

    func updateStatus(id: String, status: TaskStatus) async throws -> TaskItem {
        try await call { try await ApiClient.updateTaskStatus(taskId: id, body: TaskStatusInput(status: status.rawValue)) }
    }

    func delete(id: String) async throws {
        try await call { try await ApiClient.deleteTask(taskId: id) }
    }

    private func call<T>(_ body: () async throws -> T) async throws -> T {
        do {
            return try await body()
        } catch ApiError.httpStatus(404, _) {
            throw TasksError.notFound
        }
    }
}

/// Keeps tasks in memory, ordered the way the server orders them. For previews, tests and `-uiTesting`.
final class InMemoryTasksRepository: TasksRepository {
    private(set) var tasks: [TaskItem]
    private let now: () -> Date

    init(tasks: [TaskItem] = [], now: @escaping () -> Date = Date.init) {
        self.tasks = tasks
        self.now = now
    }

    func list(filter: TaskFilter) async throws -> [TaskItem] {
        Self.serverOrder(tasks.filter { task in
            (filter.status.map { task.taskStatus == $0 } ?? true)
                && (filter.priority.map { task.taskPriority == $0 } ?? true)
        })
    }

    func get(id: String) async throws -> TaskItem {
        guard let task = tasks.first(where: { $0.id == id }) else { throw TasksError.notFound }
        return task
    }

    func create(_ input: TaskInput) async throws -> TaskItem {
        let stamp = TaskDates.timestamp(now())
        let task = TaskItem(
            createdAt: stamp, dueDate: input.dueDate, id: UUID().uuidString.lowercased(), notes: input.notes,
            priority: input.priority, status: input.status, title: input.title, updatedAt: stamp
        )
        tasks.append(task)
        return task
    }

    func update(id: String, input: TaskInput) async throws -> TaskItem {
        try modify(id) { task in
            task.title = input.title
            task.notes = input.notes
            task.status = input.status
            task.priority = input.priority
            task.dueDate = input.dueDate
        }
    }

    func updateStatus(id: String, status: TaskStatus) async throws -> TaskItem {
        try modify(id) { $0.status = status.rawValue }
    }

    func delete(id: String) async throws {
        guard let index = tasks.firstIndex(where: { $0.id == id }) else { throw TasksError.notFound }
        tasks.remove(at: index)
    }

    private func modify(_ id: String, _ change: (inout TaskItem) -> Void) throws -> TaskItem {
        guard let index = tasks.firstIndex(where: { $0.id == id }) else { throw TasksError.notFound }
        change(&tasks[index])
        tasks[index].updatedAt = TaskDates.timestamp(now())
        return tasks[index]
    }

    /// Open before Done, then High, Medium, Low, then the earliest due date (none last), then newest first.
    static func serverOrder(_ tasks: [TaskItem]) -> [TaskItem] {
        tasks.sorted { a, b in
            if a.taskStatus.isOpen != b.taskStatus.isOpen { return a.taskStatus.isOpen }
            if a.taskPriority.rank != b.taskPriority.rank { return a.taskPriority.rank > b.taskPriority.rank }
            switch (a.dueDate, b.dueDate) {
            case let (x?, y?) where x != y: return x < y
            case (nil, _?): return false
            case (_?, nil): return true
            default: return a.createdAt > b.createdAt
            }
        }
    }
}
