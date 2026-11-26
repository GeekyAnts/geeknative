package app.core.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

/** Screens on the back stack. Names match spec/navigation.md. */
sealed interface Route : NavKey {
    @Serializable
    data object Tasks : Route

    @Serializable
    data class TaskDetail(val taskId: String) : Route

    /** [taskId] is null when creating a task. */
    @Serializable
    data class TaskEditor(val taskId: String? = null) : Route

    @Serializable
    data object Settings : Route
}
