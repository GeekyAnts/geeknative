package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository
import app.features.tasks.ApiTasksRepository
import app.features.tasks.InMemoryTasksRepository
import app.features.tasks.TasksRepository
import java.time.LocalDate

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val tasksRepository: TasksRepository,
    /** The local calendar day overdue checks use. Tests can fix it. */
    val today: () -> LocalDate = { LocalDate.now() },
    /** Set when launched for screenshot capture; navigation starts on that screen. */
    val screenshot: ScreenshotLaunch? = null,
) {
    companion object {
        fun live(context: Context) = AppContainer(
            settingsRepository = DataStoreSettingsRepository(context.applicationContext.settingsDataStore),
            tasksRepository = ApiTasksRepository(),
        )

        /** In-memory tasks, for a launch with the `uiTesting` extra. Settings stay in DataStore. */
        fun uiTesting(context: Context) = AppContainer(
            settingsRepository = DataStoreSettingsRepository(context.applicationContext.settingsDataStore),
            tasksRepository = InMemoryTasksRepository(),
        )

        /**
         * Screenshot capture. Appearance is forced in memory so it isn't written to DataStore.
         * Tasks still come from the live API; a seeded server is running during capture.
         */
        fun screenshot(context: Context, launch: ScreenshotLaunch) = AppContainer(
            settingsRepository = InMemorySettingsRepository(launch.appearance),
            tasksRepository = ApiTasksRepository(),
            screenshot = launch,
        )

        /** In-memory dependencies, for previews and tests. */
        fun preview(today: LocalDate = LocalDate.now()) = AppContainer(
            settingsRepository = InMemorySettingsRepository(),
            tasksRepository = InMemoryTasksRepository(today),
            today = { today },
        )
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
