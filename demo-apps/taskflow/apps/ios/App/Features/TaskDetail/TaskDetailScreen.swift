import SwiftUI

struct TaskDetailScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: TaskDetailViewModel
    @State private var isEditing: Bool
    @State private var confirmsDelete = false

    /// `presentsEditor` opens the editor sheet right away (screenshot launch).
    init(viewModel: TaskDetailViewModel, presentsEditor: Bool = false) {
        _viewModel = State(initialValue: viewModel)
        _isEditing = State(initialValue: presentsEditor)
    }

    var body: some View {
        ScrollView {
            content
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xl)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.taskDetailTitle)
        .toolbar {
            if viewModel.phase == .loaded {
                ToolbarItem(placement: .primaryAction) {
                    Button(Strings.taskDetailEdit) { isEditing = true }
                        .accessibilityIdentifier("taskDetail.editButton")
                }
            }
        }
        .task { await viewModel.load() }
        .sheet(isPresented: $isEditing, onDismiss: { Task { await viewModel.load() } }) {
            TaskEditorScreen(viewModel: TaskEditorViewModel(repository: container.tasksRepository, taskId: viewModel.taskId, now: container.now))
        }
        .alert(viewModel.failureMessage, isPresented: Binding(
            get: { viewModel.failure != nil },
            set: { if !$0 { viewModel.failure = nil } }
        )) {
            Button(Strings.commonDone, role: .cancel) {}
        }
        .onChange(of: viewModel.didDelete) { _, deleted in
            if deleted { dismiss() }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.phase {
        case .loading:
            LoadingView()
                .accessibilityIdentifier("taskDetail.loading")
                .padding(.top, AppSpacing.xxl)
        case .failed:
            StateMessageView(icon: AppIcon.error, title: Strings.taskDetailErrorTitle, message: Strings.taskDetailErrorBody) {
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
                .accessibilityIdentifier("taskDetail.retryButton")
            }
            .accessibilityIdentifier("taskDetail.error")
        case .notFound:
            StateMessageView(icon: AppIcon.error, title: Strings.taskDetailNotFoundTitle, message: Strings.taskDetailNotFoundBody) {
                EmptyView()
            }
            .accessibilityIdentifier("taskDetail.notFound")
        case .loaded:
            if let task = viewModel.task {
                details(task)
            }
        }
    }

    private func details(_ task: TaskItem) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xl) {
            Text(task.title)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
                .accessibilityIdentifier("taskDetail.taskTitle")

            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                sectionLabel(Strings.taskDetailStatus)
                Picker(Strings.taskDetailStatus, selection: Binding(
                    get: { task.taskStatus },
                    set: { status in Task { await viewModel.setStatus(status) } }
                )) {
                    ForEach(TaskStatus.allCases) { status in
                        Text(status.label).tag(status)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .disabled(viewModel.isBusy)
                .accessibilityIdentifier("taskDetail.status")
            }

            AppCard {
                infoRow(Strings.taskDetailPriority) {
                    PriorityLabel(priority: task.taskPriority, font: AppTypography.body)
                        .accessibilityElement(children: .combine)
                        .accessibilityIdentifier("taskDetail.priority")
                }
                Divider().overlay(AppColors.outline)
                infoRow(Strings.taskDetailDueDate) {
                    Group {
                        if task.dueDate == nil {
                            Text(viewModel.dueDateText)
                                .font(AppTypography.body)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        } else {
                            DueLabel(text: viewModel.dueDateText, isOverdue: viewModel.isOverdue, font: AppTypography.body, showsIcon: false)
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("taskDetail.dueDate")
                }
            }

            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                sectionLabel(Strings.taskDetailNotes)
                Text(viewModel.notesText)
                    .font(AppTypography.body)
                    .foregroundStyle(viewModel.hasNotes ? AppColors.onBackground : AppColors.onSurfaceVariant)
                    .textSelection(.enabled)
                    .accessibilityIdentifier("taskDetail.notes")
            }

            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(viewModel.createdText)
                    .accessibilityIdentifier("taskDetail.created")
                Text(viewModel.updatedText)
                    .accessibilityIdentifier("taskDetail.updated")
            }
            .font(AppTypography.caption)
            .foregroundStyle(AppColors.onSurfaceVariant)

            Button(role: .destructive) {
                confirmsDelete = true
            } label: {
                Label {
                    Text(Strings.taskDetailDelete)
                        .font(AppTypography.label)
                } icon: {
                    Image(AppIcon.trash)
                }
                .foregroundStyle(AppColors.error)
                .frame(minHeight: AppSize.touchTarget)
            }
            .disabled(viewModel.isBusy)
            .accessibilityIdentifier("taskDetail.deleteButton")
            .confirmationDialog(Strings.taskDetailDeleteConfirmTitle, isPresented: $confirmsDelete, titleVisibility: .visible) {
                Button(Strings.taskDetailDeleteConfirmAction, role: .destructive) {
                    Task { await viewModel.delete() }
                }
                .accessibilityIdentifier("taskDetail.confirmDelete")
                Button(Strings.commonCancel, role: .cancel) {}
            } message: {
                Text(Strings.taskDetailDeleteConfirmMessage)
            }
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(AppTypography.label)
            .foregroundStyle(AppColors.onSurfaceVariant)
    }

    private func infoRow<Value: View>(_ label: String, @ViewBuilder value: () -> Value) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: AppSpacing.md) {
            Text(label)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
            Spacer(minLength: AppSpacing.md)
            value()
        }
        .frame(minHeight: AppSize.touchTarget)
    }
}

#Preview {
    let container = AppContainer.preview()
    NavigationStack {
        TaskDetailScreen(viewModel: TaskDetailViewModel(repository: container.tasksRepository, taskId: "sample-2"))
    }
    .environment(container)
}
