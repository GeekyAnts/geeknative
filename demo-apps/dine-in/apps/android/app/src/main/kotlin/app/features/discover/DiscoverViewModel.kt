package app.features.discover

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.R
import app.features.auth.Account
import app.features.auth.AuthRepository
import app.features.catalog.Catalog
import app.features.catalog.CatalogLoad
import app.features.catalog.CatalogLoader
import app.features.catalog.CatalogRepository
import app.features.catalog.DemoAvailability
import app.features.catalog.Restaurant
import app.features.catalog.TodayAvailability
import app.features.profile.DiningPreferences
import app.features.profile.MemberName
import app.features.profile.PreferencesRepository
import app.features.reservation.Reservation
import app.features.reservation.ReservationsRepository
import app.features.saved.SavedRepository
import java.time.Clock
import java.time.LocalDateTime
import java.time.LocalTime
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class Greeting(@StringRes val label: Int) {
    Morning(R.string.discover_greeting_morning),
    Afternoon(R.string.discover_greeting_afternoon),
    Evening(R.string.discover_greeting_evening);

    companion object {
        /** Morning 05:00–11:59, afternoon 12:00–16:59, evening otherwise. */
        fun at(time: LocalTime): Greeting = when (time.hour) {
            in 5..11 -> Morning
            in 12..16 -> Afternoon
            else -> Evening
        }
    }
}

/** Reservation reminders (spec/features/discover.md: Notifications). */
object Reminders {
    private const val WINDOW_DAYS = 7L

    /** Upcoming confirmed reservations within the next 7 days, soonest first; none when reminders are off. */
    fun list(reservations: List<Reservation>, now: LocalDateTime, enabled: Boolean): List<Reservation> {
        if (!enabled) return emptyList()
        val end = now.plusDays(WINDOW_DAYS)
        return reservations.filter { it.isUpcoming(now) && !it.dateTime.isAfter(end) }.sortedBy { it.dateTime }
    }
}

/** The member's next evening: the soonest upcoming reservation. */
fun nextUpcoming(reservations: List<Reservation>, now: LocalDateTime): Reservation? =
    reservations.filter { it.isUpcoming(now) }.minByOrNull { it.dateTime }

/** Featured-style restaurants whose cuisine is in the member's favourites, best rated first. */
fun recommended(catalog: Catalog, preferences: DiningPreferences): List<Restaurant> {
    if (preferences.cuisines.isEmpty()) return emptyList()
    return catalog.restaurants.filter { it.cuisine in preferences.cuisines }.sortedByDescending { it.rating }
}

data class DiscoverContentState(
    val catalog: Catalog,
    val firstName: String,
    val initials: String,
    val greeting: Greeting,
    val savedIds: Set<String>,
    val upcoming: Reservation?,
    val featured: List<Restaurant>,
    val recommended: List<Restaurant>,
    val spotlight: Restaurant?,
    val availability: Map<String, TodayAvailability>,
    val hasReminders: Boolean,
)

sealed interface DiscoverUiState {
    data object Loading : DiscoverUiState

    data object Failed : DiscoverUiState

    data class Loaded(val content: DiscoverContentState) : DiscoverUiState
}

class DiscoverViewModel(
    catalog: CatalogRepository,
    auth: AuthRepository,
    private val saved: SavedRepository,
    reservations: ReservationsRepository,
    preferences: PreferencesRepository,
    private val clock: Clock,
) : ViewModel() {
    private val loader = CatalogLoader(catalog)

    val uiState: StateFlow<DiscoverUiState> = combine(
        loader.state,
        auth.account,
        saved.savedIds,
        reservations.reservations,
        preferences.preferences,
    ) { load, account, savedIds, list, prefs ->
        when (load) {
            CatalogLoad.Loading -> DiscoverUiState.Loading
            CatalogLoad.Failed -> DiscoverUiState.Failed
            is CatalogLoad.Loaded -> DiscoverUiState.Loaded(content(load.catalog, account, savedIds, list, prefs))
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DiscoverUiState.Loading)

    private fun content(
        catalog: Catalog,
        account: Account?,
        savedIds: List<String>,
        reservations: List<Reservation>,
        preferences: DiningPreferences,
    ): DiscoverContentState {
        val now = LocalDateTime.now(clock)
        val name = account?.name.orEmpty()
        return DiscoverContentState(
            catalog = catalog,
            firstName = MemberName.firstName(name),
            initials = MemberName.initials(name),
            greeting = Greeting.at(now.toLocalTime()),
            savedIds = savedIds.toSet(),
            upcoming = nextUpcoming(reservations, now),
            featured = catalog.restaurants.filter { it.featured },
            recommended = recommended(catalog, preferences),
            spotlight = catalog.restaurant(SPOTLIGHT_ID),
            availability = catalog.restaurants.associate { it.id to DemoAvailability.today(it, now) },
            hasReminders = Reminders.list(reservations, now, preferences.reminders).isNotEmpty(),
        )
    }

    fun retry() = loader.retry()

    fun toggleSaved(restaurantId: String) {
        viewModelScope.launch { saved.toggle(restaurantId) }
    }

    companion object {
        /** The concierge's pick (spec/features/discover.md). */
        const val SPOTLIGHT_ID = "koyo"
    }
}

data class NotificationsUiState(
    val loading: Boolean = true,
    val reminders: List<Reservation> = emptyList(),
    val restaurants: Map<String, Restaurant> = emptyMap(),
)

class NotificationsViewModel(
    catalog: CatalogRepository,
    reservations: ReservationsRepository,
    preferences: PreferencesRepository,
    private val clock: Clock,
) : ViewModel() {
    val uiState: StateFlow<NotificationsUiState> = combine(
        CatalogLoader(catalog).state,
        reservations.reservations,
        preferences.preferences,
    ) { load, list, prefs ->
        val catalog = (load as? CatalogLoad.Loaded)?.catalog
        NotificationsUiState(
            loading = load == CatalogLoad.Loading,
            reminders = Reminders.list(list, LocalDateTime.now(clock), prefs.reminders),
            restaurants = catalog?.restaurants?.associateBy { it.id }.orEmpty(),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), NotificationsUiState())
}
