package app.features.home

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.features.catalog.InMemoryCatalogRepository
import app.launchApp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h2500dp")
class HomeTest {
    @get:Rule
    val compose = createComposeRule()

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    @Test
    fun `AC-home-1 Home shows a destination search field`() {
        compose.launchApp()
        compose.onNodeWithTag("home.search").assertIsDisplayed()
    }

    @Test
    fun `AC-home-2 Home shows the featured destination photograph and name`() {
        compose.launchApp()
        compose.onNodeWithTag("home.featured").assertExists()
        compose.onAllNodesWithText("Bali")[0].assertExists()
    }

    @Test
    fun `AC-home-3 tapping featured or trending opens City details`() {
        compose.launchApp()
        compose.onNodeWithTag("home.featured").performClick()
        compose.onNodeWithTag("city.hero").assertIsDisplayed()
        compose.onNodeWithText("Bali").assertIsDisplayed()
    }

    @Test
    fun `AC-home-4 Home lists Paris Bali Tokyo Dubai London Rome and Singapore as trending in that order`() {
        compose.launchApp()
        val ids = listOf("paris", "bali", "tokyo", "dubai", "london", "rome", "singapore")
        ids.forEach { compose.onNodeWithTag("home.trending.$it").assertExists() }
        val state = HomeViewModel(InMemoryCatalogRepository(app.loadCatalog())).uiState.value
        assertEquals(ids, state.trending.map { it.id })
    }

    @Test
    fun `AC-home-5 Home shows category chips for Beaches Mountains Adventure History and Food`() {
        compose.launchApp()
        listOf("beaches", "mountains", "adventure", "history", "food").forEach { category ->
            compose.onNodeWithTag("home.category.$category").assertExists()
        }
        compose.onNodeWithText(string(R.string.category_beaches)).assertExists()
        compose.onNodeWithText(string(R.string.category_mountains)).assertExists()
        compose.onNodeWithText(string(R.string.category_adventure)).assertExists()
        compose.onNodeWithText(string(R.string.category_history)).assertExists()
        compose.onNodeWithText(string(R.string.category_food)).assertExists()
    }

    @Test
    fun `AC-home-6 tapping a category opens Explore with that category selected`() {
        compose.launchApp()
        compose.onNodeWithTag("home.category.beaches").performScrollTo().performClick()
        compose.onNodeWithTag("explore.title").assertIsDisplayed()
        compose.onNodeWithTag("explore.destination.bali").assertExists()
        compose.onNodeWithTag("explore.destination.paris").assertDoesNotExist()
    }

    @Test
    fun `AC-home-7 Home shows popular attractions with photographs and names`() {
        compose.launchApp()
        compose.onNodeWithTag("home.popular.paris-eiffel").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Eiffel Tower").assertExists()
    }
}
