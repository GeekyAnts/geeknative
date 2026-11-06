package app.core.navigation

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.R
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.features.destinations.DestinationDetailScreen
import app.features.destinations.DestinationDetailViewModel
import app.features.destinations.DestinationsScreen
import app.features.destinations.DestinationsViewModel
import app.features.experiences.ExperiencesScreen
import app.features.experiences.ExperiencesViewModel
import app.features.home.HomeScreen
import app.features.home.HomeViewModel
import app.features.packages.PackagesScreen
import app.features.packages.PackagesViewModel
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel
import app.features.venues.VenueDetailScreen
import app.features.venues.VenueDetailViewModel
import app.features.venues.VenuesScreen
import app.features.venues.VenuesViewModel
import app.features.wedding.WeddingScreen
import app.features.wedding.WeddingViewModel
import app.generated.AppIcons
import app.generated.AppTypography

/** The navigation root: one back stack, starting at Home, with five tab destinations. */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val backStack = rememberNavBackStack(Route.Home)
    val selectedTab = backStack.selectedTab()

    Scaffold(
        containerColor = AppTheme.colors.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            NavigationBar(containerColor = AppTheme.colors.surface) {
                TabDestination.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab.route,
                        onClick = { backStack.resetToTab(tab.route) },
                        icon = { Icon(tab.icon(), contentDescription = null) },
                        label = { Text(stringResource(tab.label), style = AppTypography.caption) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppTheme.colors.primary,
                            selectedTextColor = AppTheme.colors.primary,
                            indicatorColor = AppTheme.colors.surfaceVariant,
                        ),
                    )
                }
            }
        },
    ) { padding ->
        NavDisplay(
            backStack = backStack,
            modifier = Modifier.padding(padding),
            onBack = { backStack.removeLastOrNull() },
            entryDecorators = listOf(
                rememberSaveableStateHolderNavEntryDecorator(),
                rememberViewModelStoreNavEntryDecorator(),
            ),
            entryProvider = entryProvider {
                entry<Route.Home> {
                    HomeScreen(
                        viewModel = viewModel { HomeViewModel(container.weddingRepository) },
                        onOpenSettings = { backStack.add(Route.Settings) },
                        onOpenDestinations = { backStack.resetToTab(Route.Destinations) },
                        onOpenWedding = { backStack.resetToTab(Route.Wedding) },
                        onOpenDestination = { backStack.add(Route.DestinationDetail(it)) },
                        onOpenExperiences = { backStack.resetToTab(Route.Experiences) },
                        onOpenPackages = { backStack.add(Route.Packages) },
                    )
                }
                entry<Route.Destinations> {
                    DestinationsScreen(
                        viewModel = viewModel { DestinationsViewModel(container.weddingRepository) },
                        onOpenDestination = { backStack.add(Route.DestinationDetail(it)) },
                    )
                }
                entry<Route.DestinationDetail> { route ->
                    DestinationDetailScreen(
                        viewModel = viewModel { DestinationDetailViewModel(route.id, container.weddingRepository) },
                        onBack = { backStack.removeLastOrNull() },
                        onOpenVenue = { backStack.add(Route.VenueDetail(it)) },
                    )
                }
                entry<Route.Venues> {
                    VenuesScreen(
                        viewModel = viewModel { VenuesViewModel() },
                        onOpenVenue = { backStack.add(Route.VenueDetail(it)) },
                    )
                }
                entry<Route.VenueDetail> { route ->
                    VenueDetailScreen(
                        viewModel = viewModel { VenueDetailViewModel(route.id, container.weddingRepository) },
                        onBack = { backStack.removeLastOrNull() },
                    )
                }
                entry<Route.Experiences> {
                    ExperiencesScreen(viewModel = viewModel { ExperiencesViewModel(container.weddingRepository) })
                }
                entry<Route.Packages> {
                    PackagesScreen(
                        viewModel = viewModel { PackagesViewModel(container.weddingRepository) },
                        onBack = { backStack.removeLastOrNull() },
                    )
                }
                entry<Route.Wedding> {
                    WeddingScreen(
                        viewModel = viewModel { WeddingViewModel(container.weddingRepository) },
                        onOpenDestinations = { backStack.resetToTab(Route.Destinations) },
                        onOpenVenues = { backStack.resetToTab(Route.Venues) },
                        onOpenPackages = { backStack.add(Route.Packages) },
                        onOpenDestination = { backStack.add(Route.DestinationDetail(it)) },
                        onOpenVenue = { backStack.add(Route.VenueDetail(it)) },
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
}

private enum class TabDestination(val route: Route, val label: Int) {
    Home(Route.Home, R.string.nav_home),
    Destinations(Route.Destinations, R.string.nav_destinations),
    Venues(Route.Venues, R.string.nav_venues),
    Experiences(Route.Experiences, R.string.nav_experiences),
    Wedding(Route.Wedding, R.string.nav_wedding),
}

@Composable
private fun TabDestination.icon(): ImageVector = when (this) {
    TabDestination.Home -> AppIcons.home
    TabDestination.Destinations -> AppIcons.compass
    TabDestination.Venues -> AppIcons.landmark
    TabDestination.Experiences -> AppIcons.sparkles
    TabDestination.Wedding -> AppIcons.heart
}

private fun MutableList<NavKey>.resetToTab(tab: Route) {
    while (size > 1) removeAt(lastIndex)
    if (tab !is Route.Home) add(tab)
}

private fun List<NavKey>.selectedTab(): Route =
    lastOrNull { it is Route.Home || it is Route.Destinations || it is Route.Venues || it is Route.Experiences || it is Route.Wedding } as? Route
        ?: Route.Home
