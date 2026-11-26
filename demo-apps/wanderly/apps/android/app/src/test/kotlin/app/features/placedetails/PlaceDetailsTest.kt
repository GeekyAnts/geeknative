package app.features.placedetails

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import app.features.catalog.InMemoryCatalogRepository
import app.features.saved.InMemorySavedRepository
import app.features.tripplanner.GenerateRequest
import app.features.tripplanner.GenerateResult
import app.features.tripplanner.InMemoryTripRepository
import app.features.tripplanner.generateTrip
import app.launchApp
import app.loadCatalog
import app.previewContainer
import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
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
class PlaceDetailsTest {
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
    fun `AC-place-details-1 Place details shows a photograph name rating location description opening hours and duration`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val viewModel = PlaceDetailsViewModel(
            "paris-eiffel",
            catalog,
            InMemorySavedRepository(),
            InMemoryTripRepository(catalog = catalog),
        )
        val place = viewModel.uiState.first { it.place != null }.place!!
        assertTrue(place.imageUrl.isNotBlank())
        assertTrue(place.name == "Eiffel Tower")
        assertTrue(place.rating > 0)
        assertTrue(place.location.isNotBlank())
        assertTrue(place.description.isNotBlank())
        assertTrue(place.openingHours.isNotBlank())
        assertTrue(place.durationMinutes > 0)
    }

    @Test
    fun `AC-place-details-2 Save adds and removes the place from Saved`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val saved = InMemorySavedRepository()
        val viewModel = PlaceDetailsViewModel(
            "paris-eiffel",
            catalog,
            saved,
            InMemoryTripRepository(catalog = catalog),
        )
        viewModel.uiState.first { it.place != null }
        viewModel.toggleSave()
        assertTrue(saved.items.first().any { it.id == "paris-eiffel" && it.kind == "attraction" })
        viewModel.toggleSave()
        assertFalse(saved.items.first().any { it.id == "paris-eiffel" })
    }

    @Test
    fun `AC-place-details-3 Add to Trip either lists matching trips or opens Trip planner for this destination`() {
        compose.launchApp()
        compose.onNodeWithTag("home.popular.paris-eiffel").performScrollTo().performClick()
        compose.onNodeWithTag("place.addToTrip").performScrollTo().performClick()
        compose.onNodeWithTag("place.startTrip").assertIsDisplayed()
        compose.onNodeWithTag("place.startTrip").performClick()
        compose.onNodeWithTag("planner.destination").assertIsDisplayed()
        compose.onNodeWithText("Paris").assertExists()
    }

    @Test
    fun `AC-place-details-3 lists matching trips when one exists`() {
        val catalog = loadCatalog()
        val paris = catalog.destinations.first { it.id == "paris" }
        val generated = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-03"), 2, "mid", emptyList()),
            paris,
            catalog.places.associateBy { it.id },
            id = "trip-paris",
        ) as GenerateResult.Success
        compose.launchApp(previewContainer(trips = listOf(generated.trip)))
        compose.onNodeWithTag("home.popular.paris-eiffel").performScrollTo().performClick()
        compose.onNodeWithTag("place.addToTrip").performScrollTo().performClick()
        compose.onNodeWithTag("place.trip.trip-paris").assertIsDisplayed()
    }

    @Test
    fun `AC-place-details-4 an unknown place id shows the error state`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val viewModel = PlaceDetailsViewModel(
            "nope",
            catalog,
            InMemorySavedRepository(),
            InMemoryTripRepository(catalog = catalog),
        )
        val state = viewModel.uiState.first { it.notFound }
        compose.setContent {
            app.core.designsystem.AppTheme(darkTheme = false) {
                PlaceDetailsContent(
                    state = state,
                    onBack = {},
                    onToggleSave = {},
                    onAddToTrip = {},
                    onDismissSheet = {},
                    onSelectTrip = {},
                    onStartTrip = {},
                    onAddedShown = {},
                )
            }
        }
        compose.onNodeWithTag("place.error").assertIsDisplayed()
    }
}
