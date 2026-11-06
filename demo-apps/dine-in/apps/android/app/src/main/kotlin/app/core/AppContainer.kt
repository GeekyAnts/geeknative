package app.core

import android.content.Context
import android.os.Build
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.auth.AuthRepository
import app.features.auth.DataStoreAuthRepository
import app.features.auth.InMemoryAuthRepository
import app.features.catalog.BundledCatalogRepository
import app.features.catalog.CatalogRepository
import app.features.explore.DataStoreExploreRepository
import app.features.explore.ExploreRepository
import app.features.explore.InMemoryExploreRepository
import app.features.profile.DataStorePreferencesRepository
import app.features.profile.InMemoryPreferencesRepository
import app.features.profile.PreferencesRepository
import app.features.reservation.DataStoreReservationsRepository
import app.features.reservation.InMemoryReservationsRepository
import app.features.reservation.ReservationsRepository
import app.features.saved.DataStoreSavedRepository
import app.features.saved.InMemorySavedRepository
import app.features.saved.SavedRepository
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository
import java.time.Clock

private val Context.settingsDataStore by preferencesDataStore(name = "settings")
private val Context.appDataStore by preferencesDataStore(name = "app")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val authRepository: AuthRepository,
    val catalogRepository: CatalogRepository,
    val reservationsRepository: ReservationsRepository,
    val savedRepository: SavedRepository,
    val preferencesRepository: PreferencesRepository,
    val exploreRepository: ExploreRepository,
    /** Everything time-dependent reads the time from here, so tests can fix it. */
    val clock: Clock,
    /** Looks up a string resource, for view models that match text against labels (Explore search). */
    val label: (Int) -> String,
    /** Backdrop blur on glass surfaces (API 31+). Off in tests and previews. */
    val blurEnabled: Boolean = false,
    /** Loads remote photos. Off in tests, which show the skeleton instead. */
    val loadImages: Boolean = true,
    /** Set when launched for screenshot capture; navigation starts on that screen. */
    val screenshot: ScreenshotLaunch? = null,
) {
    companion object {
        fun live(context: Context): AppContainer {
            val app = context.applicationContext
            val clock = Clock.systemDefaultZone()
            val auth = DataStoreAuthRepository(app.appDataStore, clock)
            val catalog = BundledCatalogRepository(app)
            return AppContainer(
                settingsRepository = DataStoreSettingsRepository(app.settingsDataStore),
                authRepository = auth,
                catalogRepository = catalog,
                reservationsRepository = DataStoreReservationsRepository(app.appDataStore, auth, catalog, clock),
                savedRepository = DataStoreSavedRepository(app.appDataStore, auth),
                preferencesRepository = DataStorePreferencesRepository(app.appDataStore, auth),
                exploreRepository = DataStoreExploreRepository(app.appDataStore),
                clock = clock,
                label = app::getString,
                blurEnabled = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S,
            )
        }

        /** In-memory dependencies with the bundled catalog, for previews and tests. */
        fun preview(
            context: Context,
            clock: Clock = Clock.systemDefaultZone(),
            catalog: CatalogRepository = BundledCatalogRepository(context.applicationContext),
            loadImages: Boolean = false,
        ): AppContainer {
            val auth = InMemoryAuthRepository(clock)
            return AppContainer(
                settingsRepository = InMemorySettingsRepository(),
                authRepository = auth,
                catalogRepository = catalog,
                reservationsRepository = InMemoryReservationsRepository(auth, catalog, clock),
                savedRepository = InMemorySavedRepository(auth),
                preferencesRepository = InMemoryPreferencesRepository(auth),
                exploreRepository = InMemoryExploreRepository(),
                clock = clock,
                label = context.applicationContext::getString,
                loadImages = loadImages,
            )
        }

        /** In-memory dependencies seeded for screenshot capture of one screen. */
        fun screenshot(context: Context, launch: ScreenshotLaunch): AppContainer {
            val app = context.applicationContext
            val clock = ScreenshotLaunch.clock()
            val store = launch.seedStore()
            val auth = InMemoryAuthRepository(clock, store)
            val catalog = BundledCatalogRepository(app)
            return AppContainer(
                settingsRepository = InMemorySettingsRepository(launch.appearance),
                authRepository = auth,
                catalogRepository = catalog,
                reservationsRepository = InMemoryReservationsRepository(auth, catalog, clock, store),
                savedRepository = InMemorySavedRepository(auth, store),
                preferencesRepository = InMemoryPreferencesRepository(auth, store),
                exploreRepository = InMemoryExploreRepository(store),
                clock = clock,
                label = app::getString,
                blurEnabled = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S,
                loadImages = true,
                screenshot = launch,
            )
        }
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
