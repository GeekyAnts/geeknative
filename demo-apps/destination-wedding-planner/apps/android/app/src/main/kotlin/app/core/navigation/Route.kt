package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Home : Route

    @Serializable
    data object Destinations : Route

    @Serializable
    data class DestinationDetail(val id: String) : Route

    @Serializable
    data object Venues : Route

    @Serializable
    data class VenueDetail(val id: String) : Route

    @Serializable
    data object Experiences : Route

    @Serializable
    data object Packages : Route

    @Serializable
    data object Wedding : Route

    @Serializable
    data object Settings : Route
}
