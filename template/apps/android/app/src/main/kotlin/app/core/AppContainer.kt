package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.notifications.DataStoreNotificationsRepository
import app.features.notifications.InMemoryNotificationsRepository
import app.features.notifications.NotificationsRepository
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository

private val Context.settingsDataStore by preferencesDataStore(name = "settings")
private val Context.notificationsDataStore by preferencesDataStore(name = "notifications")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 * Notifications start local. To use a server, keep this local repository for the device preference
 * and pass a RemoteNotificationsRepository around your gateway.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val notificationsRepository: NotificationsRepository,
) {
    companion object {
        fun live(context: Context) = AppContainer(
            settingsRepository = DataStoreSettingsRepository(context.applicationContext.settingsDataStore),
            notificationsRepository = DataStoreNotificationsRepository(context.applicationContext.notificationsDataStore),
        )

        /** In-memory dependencies, for previews and tests. */
        fun preview() = AppContainer(
            settingsRepository = InMemorySettingsRepository(),
            notificationsRepository = InMemoryNotificationsRepository(),
        )
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
