import SwiftUI

struct TasksScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var viewModel: TasksViewModel
    @State private var isCreating = false

    init(viewModel: TasksViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                filters
                content
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.xl)
        }
        .refreshable { await viewModel.load() }
        .background(AppColors.background)
        .navigationTitle(AppIdentity.name)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                NavigationLink(value: Route.settings) {
                    Image(AppIcon.settings)
                }
                .accessibilityLabel(Strings.tasksOpenSettings)
                .accessibilityIdentifier("tasks.openSettings")

                Button {
                    isCreating = true
                } label: {
                    Image(AppIcon.add)
                }
                .accessibilityLabel(Strings.tasksAdd)
                .accessibilityIdentifier("tasks.addButton")
            }
        }
        // Runs every time Tasks becomes visible, and again whenever a filter changes.
        .task(id: viewModel.filter) { await viewModel.load() }
        .sheet(isPresented: $isCreating, onDismiss: { Task { await viewModel.load() } }) {
            TaskEditorScreen(viewModel: TaskEditorViewModel(repository: container.tasksRepository, taskId: nil, now: container.now))
        }
        .alert(Strings.tasksUpdateError, isPresented: $viewModel.showsUpdateError) {
            Button(Strings.commonDone, role: .cancel) {}
        }
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Picker(Strings.tasksFilterStatus, selection: $viewModel.filter.status) {
                Text(Strings.tasksFilterAll).tag(TaskStatus?.none)
                ForEach(TaskStatus.allCases) { status in
                    Text(status.label).tag(Optional(status))
                }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("tasks.statusFilter")

            Menu {
                Picker(Strings.tasksFilterPriority, selection: $viewModel.filter.priority) {
                    Text(Strings.tasksFilterAnyPriority).tag(TaskPriority?.none)
                    ForEach(TaskPriority.allCases.reversed()) { priority in
                        Text(priority.label).tag(Optional(priority))
                    }
                }
                .pickerStyle(.inline)
            } label: {
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.filter)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    Text(viewModel.filter.priority?.label ?? Strings.tasksFilterAnyPriority)
                        .font(AppTypography.label)
                }
                .foregroundStyle(AppColors.primary)
                .frame(minHeight: AppSize.touchTarget)
            }
            .accessibilityLabel(Strings.tasksFilterPriority)
            .accessibilityValue(viewModel.filter.priority?.label ?? Strings.tasksFilterAnyPriority)
            .accessibilityIdentifier("tasks.priorityFilter")
        }
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.content {
        case .loading:
            LoadingView()
                .accessibilityIdentifier("tasks.loading")
                .padding(.top, AppSpacing.xxl)
        case .error:
            StateMessageView(icon: AppIcon.error, title: Strings.tasksErrorTitle, message: Strings.tasksErrorBody) {
                Button {
                    Task { await viewModel.load() }
                } label: {
                    Label {
                        Text(Strings.commonRetry)
                    } icon: {
                        Image(AppIcon.retry)
                    }
                }
                .buttonStyle(.primary)
                .accessibilityIdentifier("tasks.retryButton")
            }
            .accessibilityIdentifier("tasks.error")
        case .empty:
            StateMessageView(icon: AppIcon.emptyTasks, title: Strings.tasksEmptyTitle, message: Strings.tasksEmptyBody) {
                Button(Strings.tasksAdd) { isCreating = true }
                    .buttonStyle(.primary)
                    .accessibilityIdentifier("tasks.emptyAddButton")
            }
            .accessibilityIdentifier("tasks.empty")
        case .emptyFiltered:
            StateMessageView(title: Strings.tasksEmptyFilteredTitle, message: Strings.tasksEmptyFilteredBody) {
                Button(Strings.tasksClearFilters) { viewModel.clearFilters() }
                    .buttonStyle(.primary)
                    .accessibilityIdentifier("tasks.clearFilters")
            }
            .accessibilityIdentifier("tasks.emptyFiltered")
        case .list:
            Text(viewModel.countText)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .accessibilityIdentifier("tasks.count")
            LazyVStack(spacing: AppSpacing.sm) {
                ForEach(viewModel.tasks) { task in
                    TaskRow(
                        task: task,
                        dueText: viewModel.dueText(task),
                        isOverdue: viewModel.isOverdue(task)
                    ) {
                        Task { await viewModel.toggle(task) }
                    }
                }
            }
            .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: viewModel.tasks)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("tasks.list")
        }
    }
}

/// A task card: a leading status toggle, and the rest of the row opens Task detail.
private struct TaskRow: View {
    let task: TaskItem
    let dueText: String?
    let isOverdue: Bool
    let onToggle: () -> Void

    private var isDone: Bool { task.taskStatus == .done }

    var body: some View {
        HStack(spacing: 0) {
            Button(action: onToggle) {
                Image(task.taskStatus.icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(task.taskStatus.color)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isDone ? Strings.taskMarkTodo : Strings.taskMarkDone)
            .accessibilityValue(task.taskStatus.label)
            .accessibilityIdentifier("tasks.row.\(task.id).toggle")

            NavigationLink(value: Route.taskDetail(task.id)) {
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(task.title)
                        .font(AppTypography.body)
                        .strikethrough(isDone)
                        .foregroundStyle(isDone ? AppColors.onSurfaceVariant : AppColors.onSurface)
                        .multilineTextAlignment(.leading)
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: AppSpacing.md) { metadata }
                        VStack(alignment: .leading, spacing: AppSpacing.xs) { metadata }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, AppSpacing.md)
                .padding(.trailing, AppSpacing.lg)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("tasks.row.\(task.id)")
        }
        .padding(.leading, AppSpacing.xs)
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
    }

    @ViewBuilder
    private var metadata: some View {
        PriorityLabel(priority: task.taskPriority)
        Text(task.taskStatus.label)
            .font(AppTypography.caption)
            .foregroundStyle(AppColors.onSurfaceVariant)
        if let dueText {
            DueLabel(text: dueText, isOverdue: isOverdue)
        }
    }
}

#Preview {
    let container = AppContainer.preview()
    NavigationStack {
        TasksScreen(viewModel: TasksViewModel(repository: container.tasksRepository))
    }
    .environment(container)
}
