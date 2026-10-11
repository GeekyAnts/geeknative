package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
class AppContainer(val settingsRepository: SettingsRepository) {
    companion object {
        fun live(context: Context) = AppContainer(
            settingsRepository = DataStoreSettingsRepository(context.applicationContext.settingsDataStore),
        )

        /** In-memory dependencies, for previews and tests. */
        fun preview() = AppContainer(settingsRepository = InMemorySettingsRepository())
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
