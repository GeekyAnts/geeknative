package app.core.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.core.LocalAppContainer
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel
import app.features.taskdetail.TaskDetailScreen
import app.features.taskdetail.TaskDetailViewModel
import app.features.taskeditor.TaskEditorScreen
import app.features.taskeditor.TaskEditorViewModel
import app.features.tasks.TasksScreen
import app.features.tasks.TasksViewModel

/** The navigation root: one back stack, starting at Tasks. Every screen is pushed onto it. */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val routes = container.screenshot?.routes() ?: listOf(Route.Tasks)
    val keys = Array<NavKey>(routes.size) { routes[it] }
    val backStack = rememberNavBackStack(*keys)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Route.Tasks> {
                TasksScreen(
                    viewModel = viewModel { TasksViewModel(container.tasksRepository, today = container.today) },
                    onOpenSettings = { backStack.add(Route.Settings) },
                    onOpenTask = { backStack.add(Route.TaskDetail(it)) },
                    onCreateTask = { backStack.add(Route.TaskEditor(taskId = null)) },
                )
            }
            entry<Route.TaskDetail> { key ->
                TaskDetailScreen(
                    viewModel = viewModel {
                        TaskDetailViewModel(container.tasksRepository, key.taskId, today = container.today)
                    },
                    onBack = { backStack.removeLastOrNull() },
                    onEdit = { backStack.add(Route.TaskEditor(key.taskId)) },
                    onDeleted = { backStack.removeLastOrNull() },
                )
            }
            entry<Route.TaskEditor> { key ->
                TaskEditorScreen(
                    viewModel = viewModel {
                        TaskEditorViewModel(container.tasksRepository, key.taskId, today = container.today)
                    },
                    onClose = { backStack.removeLastOrNull() },
                )
            }
            entry<Route.Settings> {
                SettingsScreen(
                    viewModel = viewModel { SettingsViewModel(container.settingsRepository) },
                    onBack = { backStack.removeLastOrNull() },
                )
            }
        },
    )
}
