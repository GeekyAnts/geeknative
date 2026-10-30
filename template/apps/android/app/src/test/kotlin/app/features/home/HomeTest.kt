package app.features.home

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
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
    fun `AC-home-2 shows the welcome card's title and text`() {
        launch()
        compose.onNodeWithText(string(R.string.home_welcome_title)).assertIsDisplayed()
        compose.onNodeWithText(string(R.string.home_welcome_body)).assertIsDisplayed()
    }

    @Test
    fun `AC-home-3 the Settings entry point opens Settings`() {
        launch()
        compose.onNodeWithContentDescription(string(R.string.home_open_settings)).assertIsDisplayed()
        compose.onNodeWithTag("home.openSettings").performClick()
        compose.onNodeWithText(string(R.string.settings_title)).assertIsDisplayed()

        // Back returns to Home.
        compose.onNodeWithContentDescription(string(R.string.common_back)).performClick()
        compose.onNodeWithText(string(R.string.home_welcome_title)).assertIsDisplayed()
    }
}
