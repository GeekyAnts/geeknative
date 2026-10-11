package app.core.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.core.LocalAppContainer
import app.features.home.HomeScreen
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel

/** The navigation root: one back stack, starting at Home. */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val backStack = rememberNavBackStack(Route.Home)

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
                    viewModel = viewModel { SettingsViewModel(container.settingsRepository) },
                    onBack = { backStack.removeLastOrNull() },
                )
            }
        },
    )
}
