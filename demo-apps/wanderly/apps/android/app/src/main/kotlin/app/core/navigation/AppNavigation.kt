package app.core.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.R
import app.core.LocalAppContainer
import app.features.citydetails.CityDetailsScreen
import app.features.citydetails.CityDetailsViewModel
import app.features.explore.ExploreScreen
import app.features.explore.ExploreViewModel
import app.features.home.HomeScreen
import app.features.home.HomeViewModel
import app.features.itinerary.ItineraryScreen
import app.features.itinerary.ItineraryViewModel
import app.features.mytrips.MyTripsScreen
import app.features.mytrips.MyTripsViewModel
import app.features.placedetails.PlaceDetailsScreen
import app.features.placedetails.PlaceDetailsViewModel
import app.features.profile.ProfileScreen
import app.features.profile.ProfileViewModel
import app.features.saved.SavedScreen
import app.features.saved.SavedViewModel
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel
import app.features.tripplanner.TripPlannerScreen
import app.features.tripplanner.TripPlannerViewModel
import app.generated.AppIconSize
import app.generated.AppIcons

private data class Tab(
    val route: Route,
    val label: Int,
    val icon: @Composable () -> Unit,
    val matches: (Route) -> Boolean,
)

/** The navigation root: one back stack, five tabs, pushed screens hide the bar. */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    val backStack = rememberNavBackStack(Route.Home)
    val current = backStack.lastOrNull() as? Route
    val showTabs = current?.isRoot() == true

    val tabs = listOf(
        Tab(Route.Home, R.string.tabs_home, { Icon(AppIcons.home, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) }) { it is Route.Home },
        Tab(Route.Explore(), R.string.tabs_explore, { Icon(AppIcons.explore, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) }) { it is Route.Explore },
        Tab(Route.Trips, R.string.tabs_trips, { Icon(AppIcons.trips, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) }) { it is Route.Trips },
        Tab(Route.Saved, R.string.tabs_saved, { Icon(AppIcons.saved, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) }) { it is Route.Saved },
        Tab(Route.Profile, R.string.tabs_profile, { Icon(AppIcons.profile, contentDescription = null, modifier = Modifier.size(AppIconSize.md)) }) { it is Route.Profile },
    )

    Scaffold(
        bottomBar = {
            if (showTabs) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = current != null && tab.matches(current),
                            onClick = { backStack.replaceRoot(tab.route) },
                            icon = tab.icon,
                            label = { Text(stringResource(tab.label)) },
                        )
                    }
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
                        viewModel = viewModel { HomeViewModel(container.catalogRepository) },
                        onSearch = { q -> backStack.replaceRoot(Route.Explore(q = q.ifBlank { null })) },
                        onCategory = { category -> backStack.replaceRoot(Route.Explore(category = category)) },
                        onOpenCity = { backStack.add(Route.City(it)) },
                        onOpenPlace = { backStack.add(Route.Place(it)) },
                    )
                }
                entry<Route.Explore> { key ->
                    ExploreScreen(
                        viewModel = viewModel {
                            ExploreViewModel(container.catalogRepository, key.q, key.category)
                        },
                        onOpenCity = { backStack.add(Route.City(it)) },
                        onOpenPlace = { backStack.add(Route.Place(it)) },
                    )
                }
                entry<Route.Trips> {
                    MyTripsScreen(
                        viewModel = viewModel {
                            MyTripsViewModel(container.tripRepository, container.catalogRepository)
                        },
                        onOpenTrip = { backStack.add(Route.Itinerary(it)) },
                        onPlan = { backStack.add(Route.Planner()) },
                    )
                }
                entry<Route.Saved> {
                    SavedScreen(
                        viewModel = viewModel {
                            SavedViewModel(container.savedRepository, container.catalogRepository)
                        },
                        onOpenCity = { backStack.add(Route.City(it)) },
                        onOpenPlace = { backStack.add(Route.Place(it)) },
                    )
                }
                entry<Route.Profile> {
                    ProfileScreen(
                        viewModel = viewModel { ProfileViewModel(container.profileRepository) },
                        onOpenSettings = { backStack.add(Route.Settings) },
                    )
                }
                entry<Route.City> { key ->
                    CityDetailsScreen(
                        viewModel = viewModel {
                            CityDetailsViewModel(key.destinationId, container.catalogRepository, container.savedRepository)
                        },
                        onBack = { backStack.removeLastOrNull() },
                        onPlanTrip = { backStack.add(Route.Planner(it)) },
                        onOpenPlace = { backStack.add(Route.Place(it)) },
                    )
                }
                entry<Route.Place> { key ->
                    PlaceDetailsScreen(
                        viewModel = viewModel {
                            PlaceDetailsViewModel(
                                key.placeId,
                                container.catalogRepository,
                                container.savedRepository,
                                container.tripRepository,
                            )
                        },
                        onBack = { backStack.removeLastOrNull() },
                        onStartTrip = { backStack.add(Route.Planner(it)) },
                    )
                }
                entry<Route.Planner> { key ->
                    TripPlannerScreen(
                        viewModel = viewModel {
                            TripPlannerViewModel(
                                container.catalogRepository,
                                container.tripRepository,
                                container.profileRepository,
                                key.destinationId,
                            )
                        },
                        onBack = { backStack.removeLastOrNull() },
                        onGenerated = { backStack.add(Route.Itinerary(it)) },
                    )
                }
                entry<Route.Itinerary> { key ->
                    ItineraryScreen(
                        viewModel = viewModel {
                            ItineraryViewModel(key.tripId, container.catalogRepository, container.tripRepository)
                        },
                        onBack = { backStack.removeLastOrNull() },
                        onOpenPlace = { backStack.add(Route.Place(it)) },
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

private fun NavBackStack<NavKey>.replaceRoot(route: Route) {
    clear()
    add(route)
}
