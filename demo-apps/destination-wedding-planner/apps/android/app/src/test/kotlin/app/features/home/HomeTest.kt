package app.features.home

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.core.app.ApplicationProvider
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
import app.features.catalog.WeddingCatalog
import app.generated.AppIdentity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class HomeTest {
    @get:Rule
    val compose = createComposeRule()

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    /** The app as it starts: the real navigation, with in-memory dependencies. */
    private fun launch() {
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides AppContainer.preview()) {
                AppTheme(darkTheme = false) { AppNavigation() }
            }
        }
    }

    @Test
    fun `AC-home-1 shows the app name as its title`() {
        launch()
        compose.onNodeWithText(AppIdentity.NAME).assertIsDisplayed()
    }

    @Test
    fun `AC-home-2 shows the hero title`() {
        launch()
        compose.onNodeWithText(string(R.string.home_hero_title)).assertIsDisplayed()
        compose.onNodeWithText(string(R.string.home_hero_body)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-3 the Settings entry point opens Settings`() {
        launch()
        compose.onNodeWithContentDescription(string(R.string.home_open_settings)).assertIsDisplayed()
        compose.onNodeWithTag("home.openSettings").performClick()
        compose.onNodeWithText(string(R.string.settings_title)).assertIsDisplayed()

        compose.onNodeWithContentDescription(string(R.string.common_back)).performClick()
        compose.onNodeWithText(string(R.string.home_hero_title)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-4 Explore Destinations opens Destinations`() {
        launch()
        compose.onNodeWithTag("home.exploreCta").performScrollTo().performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("destinations.filter.style").assertIsDisplayed()
    }

    @Test
    fun `AC-home-5 Plan Your Wedding opens Wedding`() {
        launch()
        compose.onNodeWithTag("home.planCta").performScrollTo().performClick()
        compose.onNodeWithText(string(R.string.wedding_no_date_title)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-6 lists the featured destinations from the catalog`() {
        launch()
        compose.onNodeWithTag("home.featured").performScrollTo().assertIsDisplayed()
        WeddingCatalog.destinations.forEach { destination ->
            compose.onNodeWithTag("home.destination.${destination.id}").assertExists()
        }
    }

    @Test
    fun `AC-home-7 submitting the search panel opens Destinations`() {
        launch()
        compose.onNodeWithTag("home.search.submit").performScrollTo().performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("destinations.filter.style").assertIsDisplayed()
    }
}
