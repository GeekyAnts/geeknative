import Foundation
@testable import App

/// An in-memory repository that records every call, can fail chosen operations, and can run a
/// hook while a call is in flight (to check loading and saving states).
final class FakeTasksRepository: TasksRepository {
    enum Operation: Hashable { case list, get, create, update, updateStatus, delete }

    enum Call: Equatable {
        case list(TaskFilter)
        case get(String)
        case create(TaskInput)
        case update(String, TaskInput)
        case updateStatus(String, TaskStatus)
        case delete(String)
    }

    struct Failure: Error {}

    let store: InMemoryTasksRepository
    private(set) var calls: [Call] = []
    var failing: [Operation: any Error] = [:]
    var whileInFlight: ((Operation) -> Void)?

    init(tasks: [TaskItem] = TaskSamples.make(today: TestClock.today), now: @escaping () -> Date = { TestClock.today }) {
        store = InMemoryTasksRepository(tasks: tasks, now: now)
    }

    private func begin(_ operation: Operation, _ call: Call) throws {
        calls.append(call)
        whileInFlight?(operation)
        if let error = failing[operation] { throw error }
    }

    func list(filter: TaskFilter) async throws -> [TaskItem] {
        try begin(.list, .list(filter))
        return try await store.list(filter: filter)
    }

    func get(id: String) async throws -> TaskItem {
        try begin(.get, .get(id))
        return try await store.get(id: id)
    }

    func create(_ input: TaskInput) async throws -> TaskItem {
        try begin(.create, .create(input))
        return try await store.create(input)
    }

    func update(id: String, input: TaskInput) async throws -> TaskItem {
        try begin(.update, .update(id, input))
        return try await store.update(id: id, input: input)
    }

    func updateStatus(id: String, status: TaskStatus) async throws -> TaskItem {
        try begin(.updateStatus, .updateStatus(id, status))
        return try await store.updateStatus(id: id, status: status)
    }

    func delete(id: String) async throws {
        try begin(.delete, .delete(id))
        try await store.delete(id: id)
    }
}

/// A fixed "today": Wednesday 18 November 2026, 15:00 local time.
enum TestClock {
    static let today: Date = Calendar.current.date(from: DateComponents(year: 2026, month: 11, day: 18, hour: 15))!

    static func day(_ offset: Int) -> String {
        TaskDates.dayString(TaskDates.adding(days: offset, to: today))
    }
}
