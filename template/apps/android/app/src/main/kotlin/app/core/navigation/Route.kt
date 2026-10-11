package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Home : Route

    @Serializable
    data object Settings : Route
}
