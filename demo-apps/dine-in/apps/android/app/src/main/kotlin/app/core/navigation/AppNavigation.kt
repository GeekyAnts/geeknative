package app.core.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.designsystem.LocalBlurEnabled
import app.core.designsystem.LocalRemoteImagesEnabled
import app.core.designsystem.Tab
import app.features.auth.AuthMode
import app.features.auth.AuthViewModel
import app.features.auth.SignInScreen
import app.features.auth.SignUpScreen
import app.features.auth.WelcomeScreen
import app.features.auth.WelcomeViewModel
import app.features.discover.NotificationsScreen
import app.features.discover.NotificationsViewModel
import app.features.explore.ExploreRequest
import app.features.profile.HelpScreen
import app.features.profile.PreferencesScreen
import app.features.profile.PreferencesViewModel
import app.features.reservation.ConfirmationScreen
import app.features.reservation.ReservationDetailScreen
import app.features.reservation.ReservationDetailViewModel
import app.features.reservation.ReserveScreen
import app.features.reservation.ReserveViewModel
import app.features.restaurant.RestaurantScreen
import app.features.restaurant.RestaurantViewModel
import app.features.settings.SettingsScreen
import app.features.settings.SettingsViewModel
import app.features.tabs.TabsScreen
import kotlinx.coroutines.flow.first

/** The navigation root: Welcome when signed out, tabs when signed in (spec/navigation.md). */
@Composable
fun AppNavigation() {
    val container = LocalAppContainer.current
    var sessionReady by remember { mutableStateOf(false) }
    val account by container.authRepository.account.collectAsStateWithLifecycle(initialValue = null)

    LaunchedEffect(Unit) {
        container.authRepository.account.first()
        sessionReady = true
    }

    if (!sessionReady) {
        Box(Modifier.fillMaxSize().background(AppTheme.colors.background))
        return
    }

    CompositionLocalProvider(
        LocalBlurEnabled provides container.blurEnabled,
        LocalRemoteImagesEnabled provides container.loadImages,
    ) {
        if (account == null) SignedOutNavigation(container) else SignedInNavigation(container)
    }
}

@Composable
private fun SignedOutNavigation(container: AppContainer) {
    val start = container.screenshot?.signedOutStack() ?: listOf(Route.Welcome)
    val backStack = if (start.size > 1) rememberNavBackStack(start[0], start[1]) else rememberNavBackStack(start[0])
    NavDisplay(
        backStack = backStack,
        onBack = { if (backStack.size > 1) backStack.removeLastOrNull() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Route.Welcome> {
                WelcomeScreen(
                    viewModel = viewModel { WelcomeViewModel(container.catalogRepository) },
                    onCreateAccount = { backStack.add(Route.SignUp) },
                    onSignIn = { backStack.add(Route.SignIn) },
                )
            }
            entry<Route.SignIn> {
                SignInScreen(
                    viewModel = viewModel { AuthViewModel(container.authRepository, AuthMode.SignIn) },
                    onBack = { backStack.removeLastOrNull() },
                    onSwitch = {
                        backStack.removeLastOrNull()
                        backStack.add(Route.SignUp)
                    },
                )
            }
            entry<Route.SignUp> {
                SignUpScreen(
                    viewModel = viewModel { AuthViewModel(container.authRepository, AuthMode.SignUp) },
                    onBack = { backStack.removeLastOrNull() },
                    onSwitch = {
                        backStack.removeLastOrNull()
                        backStack.add(Route.SignIn)
                    },
                )
            }
        },
    )
}

@Composable
private fun SignedInNavigation(container: AppContainer) {
    val start = container.screenshot?.signedInStack() ?: listOf(Route.Tabs)
    val backStack = if (start.size > 1) rememberNavBackStack(start[0], start[1]) else rememberNavBackStack(start[0])
    fun pop() { if (backStack.size > 1) backStack.removeLastOrNull() }
    fun replaceReserveWith(route: Route) {
        if (backStack.lastOrNull() is Route.Reserve) backStack.removeLastOrNull()
        backStack.add(route)
    }

    NavDisplay(
        backStack = backStack,
        onBack = { pop() },
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Route.Tabs> {
                var selected by rememberSaveable { mutableStateOf(container.screenshot?.tab ?: Tab.Discover) }
                var exploreRequest by remember { mutableStateOf<ExploreRequest?>(null) }
                TabsScreen(
                    selected = selected,
                    onSelect = { selected = it },
                    exploreRequest = exploreRequest,
                    onOpenNotifications = { backStack.add(Route.Notifications) },
                    onOpenExplore = { request ->
                        exploreRequest = request
                        selected = Tab.Explore
                    },
                    onOpenRestaurant = { backStack.add(Route.Restaurant(it)) },
                    onOpenReservation = { backStack.add(Route.Reservation(it)) },
                    onOpenPreferences = { backStack.add(Route.Preferences) },
                    onOpenHelp = { backStack.add(Route.Help) },
                    onOpenSettings = { backStack.add(Route.Settings) },
                    onOpenSavedTab = { selected = Tab.Saved },
                    onOpenPastReservations = { selected = Tab.Reservations },
                )
            }
            entry<Route.Restaurant> { key ->
                RestaurantScreen(
                    viewModel = viewModel {
                        RestaurantViewModel(
                            restaurantId = key.restaurantId,
                            catalog = container.catalogRepository,
                            saved = container.savedRepository,
                            clock = container.clock,
                        )
                    },
                    onBack = { pop() },
                    onReserve = { backStack.add(Route.Reserve(key.restaurantId)) },
                )
            }
            entry<Route.Reserve> { key ->
                ReserveScreen(
                    viewModel = viewModel {
                        ReserveViewModel(
                            restaurantId = key.restaurantId,
                            reservationId = key.reservationId,
                            rebookReservationId = key.rebookReservationId,
                            catalog = container.catalogRepository,
                            reservations = container.reservationsRepository,
                            preferences = container.preferencesRepository,
                            clock = container.clock,
                        )
                    },
                    onBack = { pop() },
                    onConfirmed = { id -> replaceReserveWith(Route.Confirmation(id)) },
                )
            }
            entry<Route.Confirmation> { key ->
                ConfirmationScreen(
                    viewModel = viewModel {
                        ReservationDetailViewModel(
                            reservationId = key.reservationId,
                            catalog = container.catalogRepository,
                            reservations = container.reservationsRepository,
                            clock = container.clock,
                        )
                    },
                    onBack = { pop() },
                    onDone = { pop() },
                    onOpenReservations = {
                        while (backStack.size > 1) backStack.removeLastOrNull()
                    },
                    onOpenRestaurant = { backStack.add(Route.Restaurant(it)) },
                    onModify = { restaurantId, reservationId ->
                        backStack.add(Route.Reserve(restaurantId, reservationId = reservationId))
                    },
                    onRebook = { restaurantId, reservationId ->
                        backStack.add(Route.Reserve(restaurantId, rebookReservationId = reservationId))
                    },
                )
            }
            entry<Route.Reservation> { key ->
                ReservationDetailScreen(
                    viewModel = viewModel {
                        ReservationDetailViewModel(
                            reservationId = key.reservationId,
                            catalog = container.catalogRepository,
                            reservations = container.reservationsRepository,
                            clock = container.clock,
                        )
                    },
                    onBack = { pop() },
                    onOpenRestaurant = { backStack.add(Route.Restaurant(it)) },
                    onModify = { restaurantId, reservationId ->
                        backStack.add(Route.Reserve(restaurantId, reservationId = reservationId))
                    },
                    onRebook = { restaurantId, reservationId ->
                        backStack.add(Route.Reserve(restaurantId, rebookReservationId = reservationId))
                    },
                )
            }
            entry<Route.Notifications> {
                NotificationsScreen(
                    viewModel = viewModel {
                        NotificationsViewModel(
                            container.catalogRepository,
                            container.reservationsRepository,
                            container.preferencesRepository,
                            container.clock,
                        )
                    },
                    onBack = { pop() },
                    onOpenReservation = { backStack.add(Route.Reservation(it)) },
                )
            }
            entry<Route.Preferences> {
                PreferencesScreen(
                    viewModel = viewModel { PreferencesViewModel(container.preferencesRepository) },
                    onBack = { pop() },
                )
            }
            entry<Route.Help> {
                HelpScreen(onBack = { pop() })
            }
            entry<Route.Settings> {
                SettingsScreen(
                    viewModel = viewModel { SettingsViewModel(container.settingsRepository) },
                    onBack = { pop() },
                )
            }
        },
    )
}
