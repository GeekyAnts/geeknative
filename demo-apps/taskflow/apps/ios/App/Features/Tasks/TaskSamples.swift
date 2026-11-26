import Foundation

/// The sample tasks from spec/features/tasks.md, identical on every platform. Due dates are
/// relative to `today`, so there's always an overdue task.
nonisolated enum TaskSamples {
    static func make(today: Date, calendar: Calendar = .current) -> [TaskItem] {
        func day(_ offset: Int) -> String {
            TaskDates.dayString(TaskDates.adding(days: offset, to: today, calendar: calendar), calendar: calendar)
        }
        let now = TaskDates.timestamp(today)
        return [
            TaskItem(createdAt: now, dueDate: day(1), id: "sample-1", notes: "", priority: "high",
                     status: "inProgress", title: "Finalize Q4 product roadmap", updatedAt: now),
            TaskItem(createdAt: now, dueDate: day(-1), id: "sample-2", notes: "", priority: "high",
                     status: "todo", title: "Fix crash when uploading large attachments", updatedAt: now),
            TaskItem(createdAt: now, dueDate: day(3), id: "sample-3", notes: "", priority: "medium",
                     status: "todo", title: "Prepare slides for the all-hands", updatedAt: now),
            TaskItem(createdAt: now, dueDate: nil, id: "sample-4", notes: "", priority: "low",
                     status: "done", title: "Renew the SSL certificate for staging", updatedAt: now),
        ]
    }
}
