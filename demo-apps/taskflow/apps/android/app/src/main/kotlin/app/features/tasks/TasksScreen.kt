package app.features.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.RefreshOnReturn
import app.core.designsystem.AppTheme
import app.core.designsystem.ControlContentPadding
import app.core.designsystem.SegmentedChoice
import app.core.designsystem.shadow
import app.generated.AppElevation
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppIdentity
import app.generated.AppPlurals
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import app.generated.TaskItem
import java.time.LocalDate

@Composable
fun TasksScreen(
    viewModel: TasksViewModel,
    onOpenSettings: () -> Unit,
    onOpenTask: (String) -> Unit,
    onCreateTask: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    RefreshOnReturn(onReturn = viewModel::onScreenVisible)
    TasksContent(
        state = state,
        onOpenSettings = onOpenSettings,
        onCreate = onCreateTask,
        onOpen = onOpenTask,
        onToggle = viewModel::toggleStatus,
        onStatus = viewModel::selectStatus,
        onPriority = viewModel::selectPriority,
        onClearFilters = viewModel::clearFilters,
        onRefresh = viewModel::refresh,
        onRetry = viewModel::retry,
        onDismissUpdateError = viewModel::dismissUpdateError,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksContent(
    state: TasksUiState,
    onOpenSettings: () -> Unit,
    onCreate: () -> Unit,
    onOpen: (String) -> Unit,
    onToggle: (String) -> Unit,
    onStatus: (TaskStatus?) -> Unit,
    onPriority: (TaskPriority?) -> Unit,
    onClearFilters: () -> Unit,
    onRefresh: () -> Unit,
    onRetry: () -> Unit,
    onDismissUpdateError: () -> Unit,
) {
    val updateError = stringResource(R.string.tasks_update_error)
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(state.updateError) {
        if (state.updateError) {
            snackbar.showSnackbar(updateError)
            onDismissUpdateError()
        }
    }

    val fabShape = RoundedCornerShape(AppRadius.lg)
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(AppIdentity.NAME) },
                actions = {
                    IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("tasks.openSettings")) {
                        Icon(
                            AppIcons.settings,
                            contentDescription = stringResource(R.string.tasks_open_settings),
                            modifier = Modifier.size(AppIconSize.md),
                        )
                    }
                },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                text = { Text(stringResource(R.string.tasks_add), style = AppTypography.label) },
                icon = { Icon(AppIcons.add, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) },
                onClick = onCreate,
                modifier = Modifier
                    .shadow(AppElevation.high, fabShape)
                    .testTag("tasks.addButton"),
                shape = fabShape,
                containerColor = AppTheme.colors.primary,
                contentColor = AppTheme.colors.onPrimary,
                elevation = FloatingActionButtonDefaults.elevation(0.dp, 0.dp, 0.dp, 0.dp),
            )
        },
        snackbarHost = {
            SnackbarHost(snackbar) { data ->
                Snackbar(snackbarData = data, modifier = Modifier.testTag("tasks.updateError"))
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                SegmentedChoice(
                    options = statusOptions,
                    selected = state.filter.status,
                    onSelect = onStatus,
                    label = { status ->
                        stringResource(if (status == null) R.string.tasks_filter_all else status.label)
                    },
                    modifier = Modifier.testTag("tasks.statusFilter"),
                )
                PriorityFilter(selected = state.filter.priority, onSelect = onPriority)
                if (state.phase == TasksPhase.Ready) {
                    Text(
                        AppPlurals.tasksCount(state.count),
                        style = AppTypography.caption,
                        color = AppTheme.colors.onSurfaceVariant,
                        modifier = Modifier.testTag("tasks.count"),
                    )
                }
            }
            Box(Modifier.weight(1f).fillMaxWidth()) {
                when (state.body) {
                    TasksBody.Loading -> LoadingPane(Modifier.testTag("tasks.loading"))
                    TasksBody.Error -> MessagePane(
                        tag = "tasks.error",
                        icon = AppIcons.error,
                        iconTint = AppTheme.colors.error,
                        title = stringResource(R.string.tasks_error_title),
                        body = stringResource(R.string.tasks_error_body),
                        action = {
                            Button(
                                onClick = onRetry,
                                modifier = Modifier.testTag("tasks.retryButton").height(AppSize.touchTarget),
                                contentPadding = ControlContentPadding,
                            ) {
                                Text(stringResource(R.string.common_retry), style = AppTypography.label)
                            }
                        },
                    )
                    TasksBody.Empty -> MessagePane(
                        tag = "tasks.empty",
                        icon = AppIcons.emptyTasks,
                        iconTint = AppTheme.colors.onSurfaceVariant,
                        title = stringResource(R.string.tasks_empty_title),
                        body = stringResource(R.string.tasks_empty_body),
                        action = {
                            Button(
                                onClick = onCreate,
                                modifier = Modifier.testTag("tasks.emptyAddButton").height(AppSize.touchTarget),
                                contentPadding = ControlContentPadding,
                            ) {
                                Text(stringResource(R.string.tasks_add), style = AppTypography.label)
                            }
                        },
                    )
                    TasksBody.FilteredEmpty -> PullToRefreshBox(
                        isRefreshing = state.refreshing,
                        onRefresh = onRefresh,
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        MessagePane(
                            tag = "tasks.emptyFiltered",
                            icon = AppIcons.emptyTasks,
                            iconTint = AppTheme.colors.onSurfaceVariant,
                            title = stringResource(R.string.tasks_empty_filtered_title),
                            body = stringResource(R.string.tasks_empty_filtered_body),
                            action = {
                                Button(
                                    onClick = onClearFilters,
                                    modifier = Modifier.testTag("tasks.clearFilters").height(AppSize.touchTarget),
                                    contentPadding = ControlContentPadding,
                                ) {
                                    Text(stringResource(R.string.tasks_clear_filters), style = AppTypography.label)
                                }
                            },
                        )
                    }
                    TasksBody.List -> PullToRefreshBox(
                        isRefreshing = state.refreshing,
                        onRefresh = onRefresh,
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize().testTag("tasks.list"),
                            contentPadding = PaddingValues(
                                start = AppSpacing.lg,
                                end = AppSpacing.lg,
                                bottom = AppSize.touchTarget + AppSpacing.xxl,
                            ),
                            verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
                        ) {
                            items(state.tasks, key = { it.id }) { task ->
                                TaskRow(
                                    task = task,
                                    today = state.today,
                                    onOpen = { onOpen(task.id) },
                                    onToggle = { onToggle(task.id) },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private val statusOptions: List<TaskStatus?> = listOf(null, TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done)

private data class PriorityOption(val priority: TaskPriority?, val label: Int)

private val priorityOptions = listOf(
    PriorityOption(null, R.string.tasks_filter_any_priority),
    PriorityOption(TaskPriority.High, R.string.task_priority_high),
    PriorityOption(TaskPriority.Medium, R.string.task_priority_medium),
    PriorityOption(TaskPriority.Low, R.string.task_priority_low),
)

@Composable
private fun PriorityFilter(selected: TaskPriority?, onSelect: (TaskPriority?) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val label = stringResource(
        when (selected) {
            TaskPriority.High -> R.string.task_priority_high
            TaskPriority.Medium -> R.string.task_priority_medium
            TaskPriority.Low -> R.string.task_priority_low
            null -> R.string.tasks_filter_any_priority
        },
    )
    val accessibility = stringResource(R.string.tasks_filter_priority)
    Box {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier
                .height(AppSize.touchTarget)
                .testTag("tasks.priorityFilter")
                .semantics { contentDescription = accessibility },
            contentPadding = ControlContentPadding,
        ) {
            Icon(AppIcons.filter, contentDescription = null, modifier = Modifier.size(AppIconSize.sm))
            Spacer(Modifier.width(AppSpacing.sm))
            Text(label, style = AppTypography.label)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            priorityOptions.forEach { option ->
                DropdownMenuItem(
                    text = { Text(stringResource(option.label), style = AppTypography.body) },
                    onClick = {
                        expanded = false
                        onSelect(option.priority)
                    },
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TaskRow(task: TaskItem, today: LocalDate, onOpen: () -> Unit, onToggle: () -> Unit) {
    val status = TaskStatus.fromWire(task.status)
    val priority = TaskPriority.fromWire(task.priority)
    val done = status == TaskStatus.Done
    val overdue = TaskDates.isOverdue(task, today)
    val due = task.dueDate?.let(TaskDates::parse)
    Surface(
        onClick = onOpen,
        modifier = Modifier.fillMaxWidth().testTag("tasks.row.${task.id}"),
        shape = RoundedCornerShape(AppRadius.lg),
        color = AppTheme.colors.surface,
        contentColor = AppTheme.colors.onSurface,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = AppSpacing.sm, vertical = AppSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
        ) {
            IconButton(
                onClick = onToggle,
                modifier = Modifier
                    .size(AppSize.touchTarget)
                    .testTag("tasks.row.${task.id}.toggle"),
            ) {
                Icon(
                    statusIcon(status),
                    contentDescription = stringResource(if (done) R.string.task_mark_todo else R.string.task_mark_done),
                    modifier = Modifier.size(AppIconSize.md),
                    tint = if (done) AppTheme.colors.success else AppTheme.colors.onSurface,
                )
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                Text(
                    task.title,
                    style = AppTypography.body.copy(
                        textDecoration = if (done) TextDecoration.LineThrough else TextDecoration.None,
                    ),
                    color = if (done) AppTheme.colors.onSurfaceVariant else AppTheme.colors.onSurface,
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                    itemVerticalAlignment = Alignment.CenterVertically,
                ) {
                    val priorityColor = priorityColor(priority)
                    Icon(AppIcons.priority, contentDescription = null, modifier = Modifier.size(AppIconSize.sm), tint = priorityColor)
                    Text(stringResource(priority.label), style = AppTypography.caption, color = priorityColor)
                    Text(stringResource(status.label), style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                    if (due != null) {
                        val dueColor = if (overdue) AppTheme.colors.error else AppTheme.colors.onSurfaceVariant
                        Icon(AppIcons.dueDate, contentDescription = null, modifier = Modifier.size(AppIconSize.sm), tint = dueColor)
                        if (overdue) {
                            Text(stringResource(R.string.task_overdue), style = AppTypography.caption, color = AppTheme.colors.error)
                        }
                        Text(
                            stringResource(R.string.task_due, TaskDates.formatMedium(due)),
                            style = AppTypography.caption,
                            color = dueColor,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun statusIcon(status: TaskStatus): ImageVector = when (status) {
    TaskStatus.Todo -> AppIcons.statusTodo
    TaskStatus.InProgress -> AppIcons.statusInProgress
    TaskStatus.Done -> AppIcons.statusDone
}

@Composable
private fun priorityColor(priority: TaskPriority) = when (priority) {
    TaskPriority.High -> AppTheme.colors.error
    TaskPriority.Medium -> AppTheme.colors.warning
    TaskPriority.Low -> AppTheme.colors.onSurfaceVariant
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
    iconTint: androidx.compose.ui.graphics.Color,
    title: String,
    body: String,
    action: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().testTag(tag).padding(AppSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(AppIconSize.lg), tint = iconTint)
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
private fun TasksScreenPreview() {
    AppTheme(darkTheme = false) {
        TasksContent(
            state = TasksUiState(
                phase = TasksPhase.Ready,
                tasks = TaskSamples.tasks(LocalDate.of(2026, 11, 18)),
                today = LocalDate.of(2026, 11, 18),
            ),
            onOpenSettings = {},
            onCreate = {},
            onOpen = {},
            onToggle = {},
            onStatus = {},
            onPriority = {},
            onClearFilters = {},
            onRefresh = {},
            onRetry = {},
            onDismissUpdateError = {},
        )
    }
}
