package app.features.tabs

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.zIndex
import androidx.lifecycle.viewmodel.compose.viewModel
import app.core.LocalAppContainer
import app.core.designsystem.ClubAtmosphere
import app.core.designsystem.GlassLayers
import app.core.designsystem.Tab
import app.core.designsystem.TabBar
import app.features.discover.DiscoverActions
import app.features.discover.DiscoverScreen
import app.features.discover.DiscoverViewModel
import app.features.explore.ExploreRequest
import app.features.explore.ExploreScreen
import app.features.explore.ExploreViewModel
import app.features.profile.ProfileScreen
import app.features.profile.ProfileViewModel
import app.features.reservations.ReservationsScreen
import app.features.reservations.ReservationsViewModel
import app.features.saved.SavedScreen
import app.features.saved.SavedViewModel

/** The five tab roots and the floating tab bar (spec/navigation.md). */
@Composable
fun TabsScreen(
    selected: Tab,
    onSelect: (Tab) -> Unit,
    exploreRequest: ExploreRequest?,
    onOpenNotifications: () -> Unit,
    onOpenExplore: (ExploreRequest) -> Unit,
    onOpenRestaurant: (String) -> Unit,
    onOpenReservation: (String) -> Unit,
    onOpenPreferences: () -> Unit,
    onOpenHelp: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenSavedTab: () -> Unit,
    onOpenPastReservations: () -> Unit,
) {
    val container = LocalAppContainer.current
    BackHandler(enabled = selected != Tab.Discover) { onSelect(Tab.Discover) }

    val discover = viewModel {
        DiscoverViewModel(
            container.catalogRepository,
            container.authRepository,
            container.savedRepository,
            container.reservationsRepository,
            container.preferencesRepository,
            container.clock,
        )
    }
    val explore = viewModel {
        ExploreViewModel(
            container.catalogRepository,
            container.savedRepository,
            container.exploreRepository,
            container.clock,
            container.label,
        )
    }
    val reservations = viewModel {
        ReservationsViewModel(container.catalogRepository, container.reservationsRepository, container.clock)
    }
    val saved = viewModel {
        SavedViewModel(container.catalogRepository, container.savedRepository, container.clock)
    }
    val profile = viewModel {
        ProfileViewModel(
            container.authRepository,
            container.reservationsRepository,
            container.savedRepository,
            container.preferencesRepository,
            container.clock,
        )
    }

    GlassLayers(
        modifier = Modifier.fillMaxSize(),
        content = {
            ClubAtmosphere()
            Tab.entries.forEach { tab ->
                val active = tab == selected
                Box(
                    Modifier
                        .fillMaxSize()
                        .zIndex(if (active) 1f else 0f)
                        .graphicsLayer { alpha = if (active) 1f else 0f },
                ) {
                    when (tab) {
                        Tab.Discover -> DiscoverScreen(
                            viewModel = discover,
                            actions = DiscoverActions(
                                onOpenNotifications = onOpenNotifications,
                                onOpenProfile = { onSelect(Tab.Profile) },
                                onOpenExplore = onOpenExplore,
                                onOpenRestaurant = onOpenRestaurant,
                                onOpenReservation = onOpenReservation,
                            ),
                        )
                        Tab.Explore -> ExploreScreen(
                            viewModel = explore,
                            request = exploreRequest,
                            onOpenRestaurant = onOpenRestaurant,
                        )
                        Tab.Reservations -> ReservationsScreen(
                            viewModel = reservations,
                            onOpenReservation = onOpenReservation,
                            onDiscover = { onSelect(Tab.Discover) },
                        )
                        Tab.Saved -> SavedScreen(
                            viewModel = saved,
                            onOpenRestaurant = onOpenRestaurant,
                            onExplore = { onSelect(Tab.Explore) },
                        )
                        Tab.Profile -> ProfileScreen(
                            viewModel = profile,
                            onOpenSaved = onOpenSavedTab,
                            onOpenPreferences = onOpenPreferences,
                            onOpenHistory = onOpenPastReservations,
                            onOpenSettings = onOpenSettings,
                            onOpenHelp = onOpenHelp,
                        )
                    }
                }
            }
        },
        overlay = { TabBar(selected = selected, onSelect = onSelect, modifier = Modifier.align(Alignment.BottomCenter)) },
    )
}
