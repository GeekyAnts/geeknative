package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Home : Route

    @Serializable
    data class Category(val categoryId: String) : Route

    @Serializable
    data object Search : Route

    @Serializable
    data object Cart : Route

    @Serializable
    data class OrderPlaced(val orderId: String) : Route

    @Serializable
    data object Settings : Route
}
