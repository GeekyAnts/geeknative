package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository
import app.features.wedding.DataStoreWeddingRepository
import app.features.wedding.InMemoryWeddingRepository
import app.features.wedding.WeddingRepository

private val Context.settingsDataStore by preferencesDataStore(name = "settings")
private val Context.weddingDataStore by preferencesDataStore(name = "wedding")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val weddingRepository: WeddingRepository,
) {
    companion object {
        fun live(context: Context) = AppContainer(
            settingsRepository = DataStoreSettingsRepository(context.applicationContext.settingsDataStore),
            weddingRepository = DataStoreWeddingRepository(context.applicationContext.weddingDataStore),
        )

        /** In-memory dependencies, for previews and tests. */
        fun preview(
            settingsRepository: SettingsRepository = InMemorySettingsRepository(),
            weddingRepository: WeddingRepository = InMemoryWeddingRepository(),
        ) = AppContainer(
            settingsRepository = settingsRepository,
            weddingRepository = weddingRepository,
        )
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
