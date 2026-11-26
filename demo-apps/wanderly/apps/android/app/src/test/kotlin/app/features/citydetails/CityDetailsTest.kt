package app.features.citydetails

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import app.features.catalog.InMemoryCatalogRepository
import app.features.saved.InMemorySavedRepository
import app.launchApp
import app.loadCatalog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h2500dp")
class CityDetailsTest {
    @get:Rule
    val compose = createComposeRule()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `AC-city-details-1 City details shows the cover photograph name country and description`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val viewModel = CityDetailsViewModel("bali", catalog, InMemorySavedRepository())
        val state = viewModel.uiState.first { it.destination != null }
        assertEquals("Bali", state.destination?.name)
        assertEquals("Indonesia", state.destination?.country)
        assertTrue(state.destination?.description?.isNotBlank() == true)
        assertTrue(state.destination?.imageUrl?.isNotBlank() == true)
    }

    @Test
    fun `AC-city-details-2 City details shows best time to visit weather currency and language`() = runTest {
        val viewModel = CityDetailsViewModel("bali", InMemoryCatalogRepository(loadCatalog()), InMemorySavedRepository())
        val destination = viewModel.uiState.first { it.destination != null }.destination!!
        assertTrue(destination.bestTimeToVisit.isNotBlank())
        assertTrue(destination.weather.summary.isNotBlank())
        assertTrue(destination.currency.isNotBlank())
        assertTrue(destination.language.isNotBlank())
    }

    @Test
    fun `AC-city-details-3 City details shows attractions hotels restaurants and activities each with a photograph`() = runTest {
        val viewModel = CityDetailsViewModel("bali", InMemoryCatalogRepository(loadCatalog()), InMemorySavedRepository())
        val state = viewModel.uiState.first { it.destination != null }
        assertTrue(state.attractions.isNotEmpty() && state.attractions.all { it.imageUrl.isNotBlank() })
        assertTrue(state.hotels.isNotEmpty() && state.hotels.all { it.imageUrl.isNotBlank() })
        assertTrue(state.restaurants.isNotEmpty() && state.restaurants.all { it.imageUrl.isNotBlank() })
        assertTrue(state.activities.isNotEmpty() && state.activities.all { it.imageUrl.isNotBlank() })
    }

    @Test
    fun `AC-city-details-4 Plan a Trip opens Trip planner with this destination selected`() {
        compose.launchApp()
        compose.onNodeWithTag("home.featured").performClick()
        compose.onNodeWithTag("city.planTrip").performScrollTo().performClick()
        compose.onNodeWithTag("planner.destination").assertIsDisplayed()
        compose.onNodeWithText("Bali").assertExists()
    }

    @Test
    fun `AC-city-details-5 tapping a place opens Place details`() {
        compose.launchApp()
        compose.onNodeWithTag("home.featured").performClick()
        compose.onNodeWithTag("city.place.bali-tegalalang").performScrollTo().performClick()
        compose.onNodeWithTag("place.hero").assertIsDisplayed()
        compose.onNodeWithText("Tegalalang Rice Terraces").assertExists()
    }

    @Test
    fun `AC-city-details-6 the save control adds and removes the destination from Saved`() = runTest {
        val saved = InMemorySavedRepository()
        val viewModel = CityDetailsViewModel("bali", InMemoryCatalogRepository(loadCatalog()), saved)
        viewModel.uiState.first { it.destination != null }
        assertFalse(viewModel.uiState.value.saved)
        viewModel.toggleSave()
        assertTrue(saved.items.first().any { it.id == "bali" && it.kind == "destination" })
        viewModel.toggleSave()
        assertFalse(saved.items.first().any { it.id == "bali" })
    }

    @Test
    fun `AC-city-details-7 an unknown destination id shows the error state`() = runTest {
        val viewModel = CityDetailsViewModel("nope", InMemoryCatalogRepository(loadCatalog()), InMemorySavedRepository())
        val state = viewModel.uiState.first { it.notFound }
        assertTrue(state.notFound)
        compose.setContent {
            app.core.designsystem.AppTheme(darkTheme = false) {
                CityDetailsContent(state = state, onBack = {}, onToggleSave = {}, onPlanTrip = {}, onOpenPlace = {})
            }
        }
        compose.onNodeWithTag("city.error").assertIsDisplayed()
    }
}
