import SwiftUI

/// A task's status. Raw values are the API's and match the Android and web apps.
nonisolated enum TaskStatus: String, CaseIterable, Identifiable, Sendable {
    case todo, inProgress, done

    var id: Self { self }

    var label: String {
        switch self {
        case .todo: Strings.taskStatusTodo
        case .inProgress: Strings.taskStatusInProgress
        case .done: Strings.taskStatusDone
        }
    }

    var icon: ImageResource {
        switch self {
        case .todo: AppIcon.statusTodo
        case .inProgress: AppIcon.statusInProgress
        case .done: AppIcon.statusDone
        }
    }

    var color: Color {
        self == .done ? AppColors.success : AppColors.onSurfaceVariant
    }

    var isOpen: Bool { self != .done }

    /// What the list's toggle sets: an open task becomes Done, a Done task becomes To do.
    var toggled: TaskStatus { isOpen ? .done : .todo }
}

/// A task's priority. Raw values are the API's and match the Android and web apps.
nonisolated enum TaskPriority: String, CaseIterable, Identifiable, Sendable {
    case low, medium, high

    var id: Self { self }

    var label: String {
        switch self {
        case .low: Strings.taskPriorityLow
        case .medium: Strings.taskPriorityMedium
        case .high: Strings.taskPriorityHigh
        }
    }

    var color: Color {
        switch self {
        case .low: AppColors.onSurfaceVariant
        case .medium: AppColors.warning
        case .high: AppColors.error
        }
    }

    /// Higher sorts first.
    var rank: Int {
        switch self {
        case .low: 0
        case .medium: 1
        case .high: 2
        }
    }
}

/// The list's filters. `nil` means All (status) or Any priority, which send nothing to the server.
nonisolated struct TaskFilter: Equatable, Hashable, Sendable {
    var status: TaskStatus?
    var priority: TaskPriority?

    var isActive: Bool { status != nil || priority != nil }
}

nonisolated extension TaskItem: Identifiable {
    var taskStatus: TaskStatus { TaskStatus(rawValue: status) ?? .todo }
    var taskPriority: TaskPriority { TaskPriority(rawValue: priority) ?? .medium }
}
