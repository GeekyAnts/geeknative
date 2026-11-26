package app.features.explore

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.features.catalog.InMemoryCatalogRepository
import app.launchApp
import app.loadCatalog
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h2500dp")
class ExploreTest {
    @get:Rule
    val compose = createComposeRule()

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    @Test
    fun `AC-explore-1 typing a query shows destinations and places whose names match`() {
        val viewModel = ExploreViewModel(InMemoryCatalogRepository(loadCatalog()))
        viewModel.onQueryChange("Eiffel")
        val state = viewModel.uiState.value
        assertTrue(state.places.any { it.id == "paris-eiffel" })
        assertTrue(state.destinations.none { it.id == "bali" })
        viewModel.onQueryChange("Paris")
        assertTrue(viewModel.uiState.value.destinations.any { it.id == "paris" })
    }

    @Test
    fun `AC-explore-2 choosing a category shows only destinations and places tagged with that category`() {
        val viewModel = ExploreViewModel(InMemoryCatalogRepository(loadCatalog()))
        viewModel.onCategory("beaches")
        val state = viewModel.uiState.value
        assertTrue(state.destinations.all { "beaches" in it.categories })
        assertTrue(state.places.all { it.category == "beaches" })
        assertFalse(state.destinations.any { it.id == "paris" })
    }

    @Test
    fun `AC-explore-3 tapping a destination opens City details`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_explore)).performClick()
        compose.onNodeWithTag("explore.destination.paris").performClick()
        compose.onNodeWithTag("city.hero").assertIsDisplayed()
        compose.onNodeWithText("Paris").assertExists()
    }

    @Test
    fun `AC-explore-4 with no query and no category Explore shows the full destination grid`() {
        val catalog = loadCatalog()
        val viewModel = ExploreViewModel(InMemoryCatalogRepository(catalog))
        val state = viewModel.uiState.value
        assertTrue(state.destinations.map { it.id } == catalog.destinations.map { it.id })
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_explore)).performClick()
        compose.onNodeWithTag("explore.destination.paris").assertExists()
        compose.onNodeWithTag("explore.destination.barcelona").assertExists()
    }

    @Test
    fun `AC-explore-5 a query with no matches shows the empty state`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_explore)).performClick()
        compose.onNodeWithTag("explore.search").performTextInput("zzzz-no-such-place")
        compose.onNodeWithTag("explore.empty").assertIsDisplayed()
        compose.onNodeWithTag("explore.clearFilters").assertExists()
    }
}
