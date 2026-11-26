import SwiftUI

/// Presented as a sheet with its own navigation stack (spec/navigation.md).
struct TaskEditorScreen: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: TaskEditorViewModel
    @FocusState private var titleFocused: Bool

    init(viewModel: TaskEditorViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            content
                .background(AppColors.background)
                .navigationTitle(viewModel.navigationTitle)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(Strings.commonCancel) { dismiss() }
                            .accessibilityIdentifier("taskEditor.cancelButton")
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        if viewModel.isSaving {
                            ProgressView()
                                .accessibilityLabel(Strings.commonLoading)
                        } else {
                            Button(Strings.commonSave) {
                                Task { await viewModel.save() }
                            }
                            .disabled(!viewModel.canSave)
                            .accessibilityIdentifier("taskEditor.saveButton")
                        }
                    }
                }
        }
        .interactiveDismissDisabled(viewModel.isSaving)
        .task { await viewModel.load() }
        .onChange(of: viewModel.didSave) { _, saved in
            if saved { dismiss() }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.phase {
        case .loading:
            LoadingView()
                .accessibilityIdentifier("taskEditor.loading")
                .frame(maxHeight: .infinity)
        case .failed:
            StateMessageView(icon: AppIcon.error, title: Strings.taskDetailErrorTitle) {
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
                .accessibilityIdentifier("taskEditor.retryButton")
            }
            .accessibilityIdentifier("taskEditor.error")
            .frame(maxHeight: .infinity)
        case .editing:
            form
        }
    }

    private var form: some View {
        Form {
            if viewModel.saveFailed {
                Section {
                    Text(Strings.taskEditorSaveError)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.error)
                        .accessibilityIdentifier("taskEditor.saveError")
                        .listRowBackground(AppColors.surface)
                }
            }

            Section(Strings.taskEditorTitleLabel) {
                TextField(Strings.taskEditorTitlePlaceholder, text: $viewModel.title)
                    .font(AppTypography.body)
                    .focused($titleFocused)
                    .submitLabel(.done)
                    .accessibilityIdentifier("taskEditor.titleField")
                    .listRowBackground(AppColors.surface)
                if let error = viewModel.titleError {
                    validation(error)
                        .accessibilityIdentifier("taskEditor.titleError")
                }
            }

            Section(Strings.taskEditorNotesLabel) {
                TextField(Strings.taskEditorNotesPlaceholder, text: $viewModel.notes, axis: .vertical)
                    .font(AppTypography.body)
                    .lineLimit(3...8)
                    .accessibilityIdentifier("taskEditor.notesField")
                    .listRowBackground(AppColors.surface)
                if let error = viewModel.notesError {
                    validation(error)
                        .accessibilityIdentifier("taskEditor.notesError")
                }
            }

            Section(Strings.taskEditorStatusLabel) {
                Picker(Strings.taskEditorStatusLabel, selection: $viewModel.status) {
                    ForEach(TaskStatus.allCases) { status in
                        Text(status.label).tag(status)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityIdentifier("taskEditor.status")
                .listRowBackground(AppColors.surface)
            }

            Section(Strings.taskEditorPriorityLabel) {
                Picker(Strings.taskEditorPriorityLabel, selection: $viewModel.priority) {
                    ForEach(TaskPriority.allCases) { priority in
                        Text(priority.label).tag(priority)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityIdentifier("taskEditor.priority")
                .listRowBackground(AppColors.surface)
            }

            Section {
                Toggle(Strings.taskEditorHasDueDate, isOn: Binding(
                    get: { viewModel.hasDueDate },
                    set: { viewModel.setHasDueDate($0) }
                ))
                .font(AppTypography.body)
                .tint(AppColors.primary)
                .accessibilityIdentifier("taskEditor.dueDateToggle")
                .listRowBackground(AppColors.surface)
                if viewModel.hasDueDate {
                    DatePicker(
                        Strings.taskEditorDueDateLabel,
                        selection: Binding(get: { viewModel.shownDueDate }, set: { viewModel.dueDate = $0 }),
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                    .font(AppTypography.body)
                    .accessibilityIdentifier("taskEditor.dueDate")
                    .listRowBackground(AppColors.surface)
                }
            }
        }
        .disabled(viewModel.isSaving)
        .scrollContentBackground(.hidden)
        .onAppear {
            if viewModel.isNew { titleFocused = true }
        }
    }

    private func validation(_ message: String) -> some View {
        Text(message)
            .font(AppTypography.caption)
            .foregroundStyle(AppColors.error)
            .listRowBackground(AppColors.surface)
    }
}

#Preview {
    TaskEditorScreen(viewModel: TaskEditorViewModel(repository: InMemoryTasksRepository(), taskId: nil))
}
