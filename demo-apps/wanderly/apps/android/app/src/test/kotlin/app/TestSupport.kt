package app

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.test.core.app.ApplicationProvider
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.designsystem.LocalSkipRemoteImages
import app.core.navigation.AppNavigation
import app.features.catalog.Catalog
import app.features.catalog.decodeCatalog
import app.features.profile.ProfileData
import app.features.saved.SavedItem
import app.features.tripplanner.Trip

fun loadCatalog(): Catalog {
    val context = ApplicationProvider.getApplicationContext<Context>()
    return context.assets.open("catalog.json").bufferedReader().use { decodeCatalog(it.readText()) }
}

fun previewContainer(
    catalog: Catalog = loadCatalog(),
    savedItems: List<SavedItem> = emptyList(),
    trips: List<Trip> = emptyList(),
    profile: ProfileData = ProfileData.DEFAULT,
): AppContainer = AppContainer.preview(
    catalog = catalog,
    savedItems = savedItems,
    trips = trips,
    profile = profile,
)

fun ComposeContentTestRule.launchApp(container: AppContainer = previewContainer()) {
    setContent {
        CompositionLocalProvider(
            LocalAppContainer provides container,
            LocalSkipRemoteImages provides true,
        ) {
            AppTheme(darkTheme = false) { AppNavigation() }
        }
    }
}
