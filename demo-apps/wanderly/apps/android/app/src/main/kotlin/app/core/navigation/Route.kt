package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Home : Route

    @Serializable
    data class Explore(val q: String? = null, val category: String? = null) : Route

    @Serializable
    data object Trips : Route

    @Serializable
    data object Saved : Route

    @Serializable
    data object Profile : Route

    @Serializable
    data class City(val destinationId: String) : Route

    @Serializable
    data class Place(val placeId: String) : Route

    @Serializable
    data class Planner(val destinationId: String? = null) : Route

    @Serializable
    data class Itinerary(val tripId: String) : Route

    @Serializable
    data object Settings : Route
}

fun Route.isRoot(): Boolean = when (this) {
    is Route.Home, is Route.Explore, is Route.Trips, is Route.Saved, is Route.Profile -> true
    else -> false
}
