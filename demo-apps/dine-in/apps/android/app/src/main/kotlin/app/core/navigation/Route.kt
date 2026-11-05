package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Welcome : Route

    @Serializable
    data object SignIn : Route

    @Serializable
    data object SignUp : Route

    /** The five tab roots and the tab bar. */
    @Serializable
    data object Tabs : Route

    @Serializable
    data class Restaurant(val restaurantId: String) : Route

    /**
     * [reservationId] modifies that reservation; [rebookReservationId] books again with that
     * reservation's party size and seating.
     */
    @Serializable
    data class Reserve(val restaurantId: String, val reservationId: String? = null, val rebookReservationId: String? = null) : Route

    @Serializable
    data class Confirmation(val reservationId: String) : Route

    @Serializable
    data class Reservation(val reservationId: String) : Route

    @Serializable
    data object Notifications : Route

    @Serializable
    data object Preferences : Route

    @Serializable
    data object Help : Route

    @Serializable
    data object Settings : Route
}
