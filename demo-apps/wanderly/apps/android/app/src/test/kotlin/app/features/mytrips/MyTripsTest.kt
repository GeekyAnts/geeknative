package app.features.mytrips

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.features.catalog.InMemoryCatalogRepository
import app.features.tripplanner.DataStoreTripRepository
import app.features.tripplanner.GenerateRequest
import app.features.tripplanner.GenerateResult
import app.features.tripplanner.InMemoryTripRepository
import app.features.tripplanner.TripSegment
import app.features.tripplanner.classifyTrip
import app.features.tripplanner.generateTrip
import app.launchApp
import app.loadCatalog
import app.previewContainer
import java.io.File
import java.time.LocalDate
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h2500dp")
class MyTripsTest {
    @get:Rule
    val compose = createComposeRule()

    @get:Rule
    val folder = TemporaryFolder()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    private fun sampleTrip(id: String, status: String, start: String, end: String) =
        (generateTrip(
            GenerateRequest("paris", LocalDate.parse(start), LocalDate.parse(end), 2, "mid", emptyList()),
            loadCatalog().destinations.first { it.id == "paris" },
            loadCatalog().places.associateBy { it.id },
            id = id,
        ) as GenerateResult.Success).trip.copy(status = status)

    @Test
    fun `AC-my-trips-1 Trips are split into Upcoming Past and Drafts using the status and date rules`() {
        val today = LocalDate.parse("2026-11-06")
        val draft = sampleTrip("d1", "draft", "2026-12-01", "2026-12-03")
        val upcoming = sampleTrip("u1", "upcoming", "2026-12-01", "2026-12-03")
        val past = sampleTrip("p1", "upcoming", "2026-01-01", "2026-01-05")
        assertEquals(TripSegment.Drafts, classifyTrip(draft, today))
        assertEquals(TripSegment.Upcoming, classifyTrip(upcoming, today))
        assertEquals(TripSegment.Past, classifyTrip(past, today))
    }

    @Test
    fun `AC-my-trips-2 opening a trip shows its itinerary`() {
        val trip = sampleTrip("open-1", "draft", "2026-12-01", "2026-12-03")
        compose.launchApp(previewContainer(trips = listOf(trip)))
        compose.onNodeWithText(string(R.string.tabs_trips)).performClick()
        compose.onNodeWithTag("trips.segment.drafts").performClick()
        compose.onNodeWithTag("trips.card.open-1").performClick()
        compose.onNodeWithTag("itinerary.hero").assertIsDisplayed()
    }

    @Test
    fun `AC-my-trips-3 deleting a trip after confirmation removes it from the list and from storage`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val trip = sampleTrip("del-1", "draft", "2026-12-01", "2026-12-03")
        val repo = InMemoryTripRepository(listOf(trip), catalog)
        val viewModel = MyTripsViewModel(repo, catalog, today = { LocalDate.parse("2026-11-06") })
        viewModel.select(TripSegment.Drafts)
        viewModel.uiState.first { it.trips.any { t -> t.id == "del-1" } }
        viewModel.requestDelete("del-1")
        viewModel.confirmDelete()
        assertTrue(repo.trips.first().none { it.id == "del-1" })
    }

    @Test
    fun `AC-my-trips-4 an empty segment shows that segment empty state`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_trips)).performClick()
        compose.onNodeWithTag("trips.empty").assertIsDisplayed()
        compose.onNodeWithTag("trips.plan").assertExists()
        compose.onNodeWithTag("trips.segment.past").performClick()
        compose.onNodeWithTag("trips.empty").assertIsDisplayed()
        compose.onNodeWithTag("trips.segment.drafts").performClick()
        compose.onNodeWithTag("trips.empty").assertIsDisplayed()
        compose.onNodeWithTag("trips.plan").assertExists()
    }

    @Test
    fun `AC-my-trips-5 Trips are still listed after an app restart`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val trip = sampleTrip("keep-1", "draft", "2026-12-01", "2026-12-03")
        val file = File(folder.root, "app.preferences_pb")
        val first = CoroutineScope(UnconfinedTestDispatcher() + Job())
        DataStoreTripRepository(
            PreferenceDataStoreFactory.create(scope = first, produceFile = { file }),
            catalog,
        ).upsert(trip)
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val loaded = DataStoreTripRepository(
            PreferenceDataStoreFactory.create(scope = second, produceFile = { file }),
            catalog,
        ).trips.first()
        assertTrue(loaded.any { it.id == "keep-1" })
        second.coroutineContext[Job]?.cancelAndJoin()
    }
}
