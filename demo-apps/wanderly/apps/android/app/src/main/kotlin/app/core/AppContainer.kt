package app.core

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.datastore.preferences.preferencesDataStore
import app.features.catalog.Catalog
import app.features.catalog.CatalogRepository
import app.features.catalog.InMemoryCatalogRepository
import app.features.catalog.AssetCatalogRepository
import app.features.profile.DataStoreProfileRepository
import app.features.profile.InMemoryProfileRepository
import app.features.profile.ProfileData
import app.features.profile.ProfileRepository
import app.features.saved.DataStoreSavedRepository
import app.features.saved.InMemorySavedRepository
import app.features.saved.SavedItem
import app.features.saved.SavedRepository
import app.features.settings.Appearance
import app.features.settings.DataStoreSettingsRepository
import app.features.settings.InMemorySettingsRepository
import app.features.settings.SettingsRepository
import app.features.tripplanner.DataStoreTripRepository
import app.features.tripplanner.InMemoryTripRepository
import app.features.tripplanner.Trip
import app.features.tripplanner.TripRepository

private val Context.settingsDataStore by preferencesDataStore(name = "settings")
private val Context.appDataStore by preferencesDataStore(name = "app")

/**
 * The app's dependencies, created once at launch. Composables read it from [LocalAppContainer].
 * Swap an implementation here (for example, a backend-backed repository) without touching screens.
 */
class AppContainer(
    val settingsRepository: SettingsRepository,
    val catalogRepository: CatalogRepository,
    val savedRepository: SavedRepository,
    val tripRepository: TripRepository,
    val profileRepository: ProfileRepository,
) {
    companion object {
        fun live(context: Context): AppContainer {
            val appContext = context.applicationContext
            val catalog = AssetCatalogRepository(appContext)
            val appStore = appContext.appDataStore
            return AppContainer(
                settingsRepository = DataStoreSettingsRepository(appContext.settingsDataStore),
                catalogRepository = catalog,
                savedRepository = DataStoreSavedRepository(appStore),
                tripRepository = DataStoreTripRepository(appStore, catalog),
                profileRepository = DataStoreProfileRepository(appStore),
            )
        }

        /** In-memory dependencies, for previews and tests. */
        fun preview(
            catalog: Catalog = Catalog.EMPTY,
            savedItems: List<SavedItem> = emptyList(),
            trips: List<Trip> = emptyList(),
            profile: ProfileData = ProfileData.DEFAULT,
            appearance: Appearance = Appearance.System,
        ): AppContainer {
            val catalogRepository = InMemoryCatalogRepository(catalog)
            return AppContainer(
                settingsRepository = InMemorySettingsRepository(appearance),
                catalogRepository = catalogRepository,
                savedRepository = InMemorySavedRepository(savedItems),
                tripRepository = InMemoryTripRepository(trips, catalogRepository),
                profileRepository = InMemoryProfileRepository(profile),
            )
        }
    }
}

val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }
