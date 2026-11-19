package app.core

import android.content.Intent
import app.core.navigation.Route
import app.features.settings.Appearance

/**
 * Intent extras that open a named screen for screenshot capture.
 *
 * - `screenshotScreen`: `tasks`, `task-detail`, `task-editor` or `settings`
 * - `screenshotAppearance`: `light` or `dark` (forced for the session, not stored)
 * - `screenshotTaskId`: the task for the detail and editor shots
 *
 * The back stack is the screen's natural one, with Tasks underneath.
 * Screenshot launches keep the live [app.features.tasks.ApiTasksRepository].
 */
data class ScreenshotLaunch(
    val screen: String,
    val appearance: Appearance,
    val taskId: String,
) {
    fun routes(): List<Route> = when (screen) {
        "task-detail" -> listOf(Route.Tasks, Route.TaskDetail(taskId))
        "task-editor" -> listOf(Route.Tasks, Route.TaskDetail(taskId), Route.TaskEditor(taskId))
        "settings" -> listOf(Route.Tasks, Route.Settings)
        else -> listOf(Route.Tasks)
    }

    companion object {
        const val SCREEN_EXTRA = "screenshotScreen"
        const val APPEARANCE_EXTRA = "screenshotAppearance"
        const val TASK_EXTRA = "screenshotTaskId"

        /** Seeded task the showcase opens when a shot doesn't pass its own id. */
        const val DEFAULT_TASK_ID = "0b6f4c1e-2a7d-4e59-9c3b-5d8e1f2a3b01"

        fun from(intent: Intent?): ScreenshotLaunch? {
            val screen = intent?.getStringExtra(SCREEN_EXTRA)?.takeIf { it.isNotBlank() } ?: return null
            val taskId = intent.getStringExtra(TASK_EXTRA)?.takeIf { it.isNotBlank() } ?: DEFAULT_TASK_ID
            return ScreenshotLaunch(
                screen = screen,
                appearance = Appearance.fromId(intent.getStringExtra(APPEARANCE_EXTRA)),
                taskId = taskId,
            )
        }
    }
}

/** True when the activity was started with the `uiTesting=true` extra (boolean or string). */
fun Intent.requestsUiTesting(): Boolean =
    getBooleanExtra(UI_TESTING_EXTRA, false) || getStringExtra(UI_TESTING_EXTRA) == "true"

const val UI_TESTING_EXTRA = "uiTesting"
