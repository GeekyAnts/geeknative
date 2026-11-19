package app.features.taskdetail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.RefreshOnReturn
import app.core.designsystem.AppCard
import app.core.designsystem.AppTheme
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.SegmentedChoice
import app.features.tasks.TaskDates
import app.features.tasks.TaskPriority
import app.features.tasks.TaskSamples
import app.features.tasks.TaskStatus
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import app.generated.TaskItem
import java.time.LocalDate

@Composable
fun TaskDetailScreen(
    viewModel: TaskDetailViewModel,
    onBack: () -> Unit,
    onEdit: () -> Unit,
    onDeleted: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    RefreshOnReturn(onReturn = viewModel::onScreenVisible)
    LaunchedEffect(state.deleted) {
        if (state.deleted) onDeleted()
    }
    TaskDetailContent(
        state = state,
        onBack = onBack,
        onEdit = onEdit,
        onStatus = viewModel::selectStatus,
        onRequestDelete = viewModel::requestDelete,
        onCancelDelete = viewModel::cancelDelete,
        onConfirmDelete = viewModel::confirmDelete,
        onRetry = viewModel::retry,
        onDismissMessage = viewModel::dismissMessage,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailContent(
    state: TaskDetailUiState,
    onBack: () -> Unit,
    onEdit: () -> Unit,
    onStatus: (TaskStatus) -> Unit,
    onRequestDelete: () -> Unit,
    onCancelDelete: () -> Unit,
    onConfirmDelete: () -> Unit,
    onRetry: () -> Unit,
    onDismissMessage: () -> Unit,
) {
    val updateError = stringResource(R.string.task_detail_update_error)
    val deleteError = stringResource(R.string.task_detail_delete_error)
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(state.message) {
        val text = when (state.message) {
            TaskDetailMessage.UpdateError -> updateError
            TaskDetailMessage.DeleteError -> deleteError
            null -> return@LaunchedEffect
        }
        snackbar.showSnackbar(text)
        onDismissMessage()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.task_detail_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            AppIcons.back,
                            contentDescription = stringResource(R.string.common_back),
                            modifier = Modifier.size(AppIconSize.md),
                        )
                    }
                },
                actions = {
                    if (state.phase == TaskDetailPhase.Ready) {
                        IconButton(onClick = onEdit, modifier = Modifier.testTag("taskDetail.editButton")) {
                            Icon(
                                AppIcons.edit,
                                contentDescription = stringResource(R.string.task_detail_edit),
                                modifier = Modifier.size(AppIconSize.md),
                            )
                        }
                    }
                },
            )
        },
        snackbarHost = {
            SnackbarHost(snackbar) { data ->
                Snackbar(snackbarData = data, modifier = Modifier.testTag("taskDetail.message"))
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (state.phase) {
                TaskDetailPhase.Loading -> LoadingPane(Modifier.testTag("taskDetail.loading"))
                TaskDetailPhase.Error -> MessagePane(
                    tag = "taskDetail.error",
                    icon = AppIcons.error,
                    title = stringResource(R.string.task_detail_error_title),
                    body = stringResource(R.string.task_detail_error_body),
                    action = {
                        Button(
                            onClick = onRetry,
                            modifier = Modifier.testTag("taskDetail.retryButton").height(AppSize.touchTarget),
                            contentPadding = ControlContentPadding,
                        ) {
                            Text(stringResource(R.string.common_retry), style = AppTypography.label)
                        }
                    },
                )
                TaskDetailPhase.NotFound -> MessagePane(
                    tag = "taskDetail.notFound",
                    icon = AppIcons.error,
                    title = stringResource(R.string.task_detail_not_found_title),
                    body = stringResource(R.string.task_detail_not_found_body),
                    action = {},
                )
                TaskDetailPhase.Ready -> state.task?.let { task ->
                    TaskDetailBody(
                        task = task,
                        today = state.today,
                        busy = state.busy,
                        onStatus = onStatus,
                        onDelete = onRequestDelete,
                    )
                }
            }
        }
    }

    if (state.confirmDelete) {
        AlertDialog(
            onDismissRequest = onCancelDelete,
            title = { Text(stringResource(R.string.task_detail_delete_confirm_title)) },
            text = { Text(stringResource(R.string.task_detail_delete_confirm_message)) },
            confirmButton = {
                TextButton(onClick = onConfirmDelete, modifier = Modifier.testTag("taskDetail.confirmDelete")) {
                    Text(stringResource(R.string.task_detail_delete_confirm_action), color = AppTheme.colors.error)
                }
            },
            dismissButton = {
                TextButton(onClick = onCancelDelete) {
                    Text(stringResource(R.string.common_cancel))
                }
            },
        )
    }
}

@Composable
private fun TaskDetailBody(
    task: TaskItem,
    today: LocalDate,
    busy: Boolean,
    onStatus: (TaskStatus) -> Unit,
    onDelete: () -> Unit,
) {
    val status = TaskStatus.fromWire(task.status)
    val priority = TaskPriority.fromWire(task.priority)
    val due = task.dueDate?.let(TaskDates::parse)
    val overdue = TaskDates.isOverdue(task, today)
    val priorityColor = when (priority) {
        TaskPriority.High -> AppTheme.colors.error
        TaskPriority.Medium -> AppTheme.colors.warning
        TaskPriority.Low -> AppTheme.colors.onSurfaceVariant
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(AppSpacing.lg),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
    ) {
        Text(task.title, style = AppTypography.headline, modifier = Modifier.testTag("taskDetail.taskTitle"))
        Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            Text(
                stringResource(R.string.task_detail_status),
                style = AppTypography.label,
                color = AppTheme.colors.onSurfaceVariant,
            )
            SegmentedChoice(
                options = TaskStatus.entries,
                selected = status,
                onSelect = onStatus,
                enabled = !busy,
                label = { stringResource(it.label) },
                modifier = Modifier.testTag("taskDetail.status"),
            )
        }
        AppCard {
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Text(
                    stringResource(R.string.task_detail_priority),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                ) {
                    Icon(AppIcons.priority, contentDescription = null, modifier = Modifier.size(AppIconSize.sm), tint = priorityColor)
                    Text(
                        stringResource(priority.label),
                        style = AppTypography.body,
                        color = priorityColor,
                        modifier = Modifier.testTag("taskDetail.priority"),
                    )
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Text(
                    stringResource(R.string.task_detail_due_date),
                    style = AppTypography.label,
                    color = AppTheme.colors.onSurfaceVariant,
                )
                val dueColor = if (overdue) AppTheme.colors.error else AppTheme.colors.onSurface
                Column {
                    if (overdue) {
                        Text(stringResource(R.string.task_overdue), style = AppTypography.body, color = AppTheme.colors.error)
                    }
                    Text(
                        if (due == null) stringResource(R.string.task_detail_no_due_date) else TaskDates.formatLong(due),
                        style = AppTypography.body,
                        color = if (due == null) AppTheme.colors.onSurfaceVariant else dueColor,
                        modifier = Modifier.testTag("taskDetail.dueDate"),
                    )
                }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
            Text(
                stringResource(R.string.task_detail_notes),
                style = AppTypography.label,
                color = AppTheme.colors.onSurfaceVariant,
            )
            val notes = task.notes.ifBlank { null }
            Text(
                notes ?: stringResource(R.string.task_detail_no_notes),
                style = AppTypography.body,
                color = if (notes == null) AppTheme.colors.onSurfaceVariant else AppTheme.colors.onSurface,
                modifier = Modifier.testTag("taskDetail.notes"),
            )
        }
        Text(
            stringResource(R.string.task_detail_created, TaskDates.formatTimestamp(task.createdAt)),
            style = AppTypography.caption,
            color = AppTheme.colors.onSurfaceVariant,
            modifier = Modifier.testTag("taskDetail.created"),
        )
        Text(
            stringResource(R.string.task_detail_updated, TaskDates.formatTimestamp(task.updatedAt)),
            style = AppTypography.caption,
            color = AppTheme.colors.onSurfaceVariant,
            modifier = Modifier.testTag("taskDetail.updated"),
        )
        Button(
            onClick = onDelete,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().height(AppSize.touchTarget).testTag("taskDetail.deleteButton"),
            contentPadding = ControlContentPadding,
            colors = ButtonDefaults.buttonColors(
                containerColor = AppTheme.colors.error,
                contentColor = AppTheme.colors.onError,
            ),
        ) {
            Icon(AppIcons.trash, contentDescription = null, modifier = Modifier.size(AppIconSize.md))
            Spacer(Modifier.size(AppSpacing.sm))
            Text(stringResource(R.string.task_detail_delete), style = AppTypography.label)
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
    tag: String,
    icon: ImageVector,
    title: String,
    body: String,
    action: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().testTag(tag).padding(AppSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(AppIconSize.lg), tint = AppTheme.colors.error)
        Spacer(Modifier.height(AppSpacing.md))
        Text(title, style = AppTypography.title)
        Spacer(Modifier.height(AppSpacing.sm))
        Text(body, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        Spacer(Modifier.height(AppSpacing.lg))
        action()
    }
}

@Preview
@Composable
private fun TaskDetailPreview() {
    AppTheme(darkTheme = false) {
        TaskDetailContent(
            state = TaskDetailUiState(
                phase = TaskDetailPhase.Ready,
                task = TaskSamples.tasks(LocalDate.of(2026, 11, 18)).first(),
                today = LocalDate.of(2026, 11, 18),
            ),
            onBack = {},
            onEdit = {},
            onStatus = {},
            onRequestDelete = {},
            onCancelDelete = {},
            onConfirmDelete = {},
            onRetry = {},
            onDismissMessage = {},
        )
    }
}
