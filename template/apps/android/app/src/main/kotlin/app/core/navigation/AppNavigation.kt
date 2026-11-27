package app.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.core.LocalAppContainer
import app.features.notifications.NotificationRoutes
import app.features.home.HomeScreen
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel

/** The navigation root: one back stack, starting at Home. */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val backStack = rememberNavBackStack(Route.Home)
    val opened by NotificationRoutes.route.collectAsStateWithLifecycle()
    LaunchedEffect(opened) {
        val route = opened ?: return@LaunchedEffect
        // A tap already opened this app. Show the screen the row points at.
        if (route == "settings") backStack.add(Route.Settings) else {
            backStack.clear()
            backStack.add(Route.Home)
        }
        NotificationRoutes.consume()
    }

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Route.Home> {
                HomeScreen(onOpenSettings = { backStack.add(Route.Settings) })
            }
            entry<Route.Settings> {
                SettingsScreen(
                    viewModel = viewModel {
                        SettingsViewModel(container.settingsRepository, container.notificationsRepository)
                    },
                    onBack = { backStack.removeLastOrNull() },
                )
            }
        },
    )
}
