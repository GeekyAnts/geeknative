package app.core.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.core.LocalAppContainer
import app.features.cart.CartScreen
import app.features.cart.CartViewModel
import app.features.catalog.CategoryScreen
import app.features.catalog.CategoryViewModel
import app.features.home.HomeScreen
import app.features.home.HomeViewModel
import app.features.order.OrderPlacedScreen
import app.features.order.OrderPlacedViewModel
import app.features.search.SearchScreen
import app.features.search.SearchViewModel
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel

/** The navigation root: one back stack, starting at Home (spec/navigation.md). */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val start = container.screenshot?.backStack() ?: listOf(Route.Home)
    val backStack = rememberNavBackStack(*start.toTypedArray())
    val back: () -> Unit = { backStack.removeLastOrNull() }

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Route.Home> {
                HomeScreen(
                    viewModel = viewModel { HomeViewModel(container.catalogRepository, container.cartRepository) },
                    onOpenSettings = { backStack.add(Route.Settings) },
                    onOpenCart = { backStack.add(Route.Cart) },
                    onOpenSearch = { backStack.add(Route.Search) },
                    onOpenCategory = { backStack.add(Route.Category(it)) },
                )
            }
            entry<Route.Category> { key ->
                CategoryScreen(
                    viewModel = viewModel { CategoryViewModel(container.catalogRepository, container.cartRepository, key.categoryId) },
                    onBack = back,
                    onOpenCart = { backStack.add(Route.Cart) },
                )
            }
            entry<Route.Search> {
                SearchScreen(
                    viewModel = viewModel { SearchViewModel(container.catalogRepository, container.cartRepository) },
                    onBack = back,
                    onOpenCart = { backStack.add(Route.Cart) },
                )
            }
            entry<Route.Cart> {
                CartScreen(
                    viewModel = viewModel {
                        CartViewModel(container.catalogRepository, container.cartRepository, container.ordersRepository, container.clock)
                    },
                    onBack = back,
                    onStartShopping = { backStack.popToHome() },
                    // Order placed replaces Cart, so Back returns to where the shopper was before Cart.
                    onOrderPlaced = { orderId -> backStack.replaceLast(Route.OrderPlaced(orderId)) },
                )
            }
            entry<Route.OrderPlaced> { key ->
                OrderPlacedScreen(
                    viewModel = viewModel { OrderPlacedViewModel(container.ordersRepository, key.orderId) },
                    onBack = back,
                    onContinueShopping = { backStack.popToHome() },
                )
            }
            entry<Route.Settings> {
                SettingsScreen(
                    viewModel = viewModel { SettingsViewModel(container.settingsRepository) },
                    onBack = back,
                )
            }
        },
    )
}

/** Clears the stack back to Home. */
private fun NavBackStack<NavKey>.popToHome() {
    while (size > 1) removeAt(lastIndex)
}

private fun NavBackStack<NavKey>.replaceLast(route: Route) {
    if (isNotEmpty()) removeAt(lastIndex)
    add(route)
}
