import SwiftUI

/// The priority with its icon, in its role color (DESIGN.md: Priority and due labels).
struct PriorityLabel: View {
    let priority: TaskPriority
    var font: Font = AppTypography.caption

    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            Image(AppIcon.priority)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                .accessibilityHidden(true)
            Text(priority.label)
                .font(font)
        }
        .foregroundStyle(priority.color)
    }
}

/// A due date with its icon. An overdue date shows `task.overdue` first, both in `error`.
struct DueLabel: View {
    let text: String
    let isOverdue: Bool
    var font: Font = AppTypography.caption
    var showsIcon = true

    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            if showsIcon {
                Image(AppIcon.dueDate)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    .accessibilityHidden(true)
            }
            if isOverdue {
                Text(Strings.taskOverdue)
                    .font(font)
                    .fontWeight(.semibold)
            }
            Text(text)
                .font(font)
        }
        .foregroundStyle(isOverdue ? AppColors.error : AppColors.onSurfaceVariant)
    }
}
