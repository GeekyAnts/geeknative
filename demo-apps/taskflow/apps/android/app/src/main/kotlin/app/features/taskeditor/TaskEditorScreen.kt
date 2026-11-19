package app.features.taskeditor

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AppTheme
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.SegmentedChoice
import app.features.tasks.TaskDates
import app.features.tasks.TaskPriority
import app.features.tasks.TaskStatus
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun TaskEditorScreen(viewModel: TaskEditorViewModel, onClose: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(state.saved) {
        if (state.saved) onClose()
    }
    TaskEditorContent(
        state = state,
        onClose = onClose,
        onTitleChange = viewModel::onTitleChange,
        onTitleFocus = viewModel::onTitleFocus,
        onNotesChange = viewModel::onNotesChange,
        onStatus = viewModel::setStatus,
        onPriority = viewModel::setPriority,
        onDueDateEnabled = viewModel::setDueDateEnabled,
        onDueDate = viewModel::setDueDate,
        onSave = viewModel::save,
        onRetry = viewModel::retry,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskEditorContent(
    state: TaskEditorUiState,
    onClose: () -> Unit,
    onTitleChange: (String) -> Unit,
    onTitleFocus: (Boolean) -> Unit,
    onNotesChange: (String) -> Unit,
    onStatus: (TaskStatus) -> Unit,
    onPriority: (TaskPriority) -> Unit,
    onDueDateEnabled: (Boolean) -> Unit,
    onDueDate: (java.time.LocalDate) -> Unit,
    onSave: () -> Unit,
    onRetry: () -> Unit,
) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(state.isNew, state.loading) {
        if (state.isNew && !state.loading) focus.requestFocus()
    }
    var picking by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        stringResource(
                            if (state.isNew) R.string.task_editor_new_title else R.string.task_editor_edit_title,
                        ),
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onClose, modifier = Modifier.testTag("taskEditor.cancelButton")) {
                        Icon(
                            AppIcons.close,
                            contentDescription = stringResource(R.string.common_cancel),
                            modifier = Modifier.size(AppIconSize.md),
                        )
                    }
                },
                actions = {
                    TextButton(
                        onClick = onSave,
                        enabled = state.canSave,
                        modifier = Modifier.testTag("taskEditor.saveButton"),
                    ) {
                        if (state.saving) {
                            CircularProgressIndicator(modifier = Modifier.size(AppIconSize.sm))
                            Spacer(Modifier.size(AppSpacing.sm))
                        }
                        Text(stringResource(R.string.common_save), style = AppTypography.label)
                    }
                },
            )
        },
    ) { padding ->
        when {
            state.loading -> LoadingPane(Modifier.padding(padding).testTag("taskEditor.loading"))
            state.loadError -> MessagePane(
                modifier = Modifier.padding(padding),
                tag = "taskEditor.error",
                icon = AppIcons.error,
                title = stringResource(R.string.task_detail_error_title),
                action = {
                    Button(
                        onClick = onRetry,
                        modifier = Modifier.testTag("taskEditor.retryButton").height(AppSize.touchTarget),
                        contentPadding = ControlContentPadding,
                    ) {
                        Text(stringResource(R.string.common_retry), style = AppTypography.label)
                    }
                },
            )
            else -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(AppSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                if (state.saveError) {
                    Text(
                        stringResource(R.string.task_editor_save_error),
                        style = AppTypography.body,
                        color = AppTheme.colors.error,
                        modifier = Modifier.testTag("taskEditor.saveError"),
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                    OutlinedTextField(
                        value = state.title,
                        onValueChange = onTitleChange,
                        enabled = !state.saving,
                        singleLine = true,
                        isError = state.titleError != null,
                        label = { Text(stringResource(R.string.task_editor_title_label)) },
                        placeholder = { Text(stringResource(R.string.task_editor_title_placeholder)) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("taskEditor.titleField")
                            .focusRequester(focus)
                            .onFocusChanged { onTitleFocus(it.isFocused) },
                    )
                    state.titleError?.let { error ->
                        Text(
                            stringResource(
                                if (error == TaskEditorTitleError.Required) R.string.task_editor_title_required
                                else R.string.task_editor_title_too_long,
                            ),
                            style = AppTypography.caption,
                            color = AppTheme.colors.error,
                            modifier = Modifier.testTag("taskEditor.titleError"),
                        )
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                    OutlinedTextField(
                        value = state.notes,
                        onValueChange = onNotesChange,
                        enabled = !state.saving,
                        minLines = 4,
                        isError = state.notesTooLong,
                        label = { Text(stringResource(R.string.task_editor_notes_label)) },
                        placeholder = { Text(stringResource(R.string.task_editor_notes_placeholder)) },
                        modifier = Modifier.fillMaxWidth().testTag("taskEditor.notesField"),
                    )
                    if (state.notesTooLong) {
                        Text(
                            stringResource(R.string.task_editor_notes_too_long),
                            style = AppTypography.caption,
                            color = AppTheme.colors.error,
                            modifier = Modifier.testTag("taskEditor.notesError"),
                        )
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    Text(
                        stringResource(R.string.task_editor_status_label),
                        style = AppTypography.label,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                    SegmentedChoice(
                        options = TaskStatus.entries,
                        selected = state.status,
                        onSelect = onStatus,
                        enabled = !state.saving,
                        label = { stringResource(it.label) },
                        modifier = Modifier.testTag("taskEditor.status"),
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    Text(
                        stringResource(R.string.task_editor_priority_label),
                        style = AppTypography.label,
                        color = AppTheme.colors.onSurfaceVariant,
                    )
                    SegmentedChoice(
                        options = TaskPriority.entries,
                        selected = state.priority,
                        onSelect = onPriority,
                        enabled = !state.saving,
                        label = { stringResource(it.label) },
                        modifier = Modifier.testTag("taskEditor.priority"),
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = AppSize.touchTarget)
                        .testTag("taskEditor.dueDateToggle")
                        .toggleable(
                            value = state.dueDate != null,
                            enabled = !state.saving,
                            role = Role.Switch,
                            onValueChange = onDueDateEnabled,
                        ),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(stringResource(R.string.task_editor_has_due_date), style = AppTypography.body)
                    Switch(checked = state.dueDate != null, onCheckedChange = null, enabled = !state.saving)
                }
                state.dueDate?.let { date ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = AppSize.touchTarget)
                            .testTag("taskEditor.dueDate")
                            .clickable(enabled = !state.saving, role = Role.Button, onClick = { picking = true }),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(stringResource(R.string.task_editor_due_date_label), style = AppTypography.body)
                        Text(
                            TaskDates.formatMedium(date),
                            style = AppTypography.body,
                            color = AppTheme.colors.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }

    if (picking && state.dueDate != null) {
        val picker = rememberDatePickerState(initialSelectedDateMillis = TaskDates.toEpochMillis(state.dueDate))
        DatePickerDialog(
            onDismissRequest = { picking = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        picker.selectedDateMillis?.let { onDueDate(TaskDates.fromEpochMillis(it)) }
                        picking = false
                    },
                ) {
                    Text(stringResource(R.string.common_done))
                }
            },
            dismissButton = {
                TextButton(onClick = { picking = false }) {
                    Text(stringResource(R.string.common_cancel))
                }
            },
        ) {
            DatePicker(state = picker)
        }
    }
}

@Composable
private fun LoadingPane(modifier: Modifier = Modifier) {
    val label = stringResource(R.string.common_loading)
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(Modifier.semantics { contentDescription = label })
    }
}

@Composable
private fun MessagePane(
    modifier: Modifier,
    tag: String,
    icon: ImageVector,
    title: String,
    action: @Composable () -> Unit,
) {
    Column(
        modifier = modifier.fillMaxSize().testTag(tag).padding(AppSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(AppIconSize.lg), tint = AppTheme.colors.error)
        Spacer(Modifier.height(AppSpacing.md))
        Text(title, style = AppTypography.title)
        Spacer(Modifier.height(AppSpacing.lg))
        action()
    }
}

@Preview
@Composable
private fun TaskEditorPreview() {
    AppTheme(darkTheme = false) {
        TaskEditorContent(
            state = TaskEditorUiState(),
            onClose = {},
            onTitleChange = {},
            onTitleFocus = {},
            onNotesChange = {},
            onStatus = {},
            onPriority = {},
            onDueDateEnabled = {},
            onDueDate = {},
            onSave = {},
            onRetry = {},
        )
    }
}
