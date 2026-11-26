package app.features.tripplanner

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.features.catalog.InMemoryCatalogRepository
import app.features.profile.InMemoryProfileRepository
import app.features.profile.ProfileData
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
class TripPlannerTest {
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

    private fun catalogRepo() = InMemoryCatalogRepository(loadCatalog())

    @Test
    fun `AC-trip-planner-1 Generate requires a destination start date and end date`() {
        val catalog = catalogRepo()
        val result = generateTrip(
            GenerateRequest(null, null, null, 2, "mid", emptyList()),
            destination = null,
            placesById = emptyMap(),
        )
        assertTrue(result is GenerateResult.MissingDestination)
        val missingDates = generateTrip(
            GenerateRequest("paris", null, null, 2, "mid", emptyList()),
            catalog.destination("paris"),
            catalog.places().associateBy { it.id },
        )
        assertTrue(missingDates is GenerateResult.MissingDates)
    }

    @Test
    fun `AC-trip-planner-2 an end date before the start date shows dateError and does not create a trip`() = runTest {
        val catalog = catalogRepo()
        val trips = InMemoryTripRepository(catalog = catalog)
        val viewModel = TripPlannerViewModel(catalog, trips, InMemoryProfileRepository(), "paris")
        viewModel.selectStart(LocalDate.parse("2026-12-10"))
        viewModel.selectEnd(LocalDate.parse("2026-12-01"))
        viewModel.generate()
        assertTrue(viewModel.uiState.value.dateError)
        assertTrue(trips.trips.first().isEmpty())
    }

    @Test
    fun `AC-trip-planner-3 Generate creates one itinerary day per stay day capped at 7 using the destination templates`() {
        val catalog = loadCatalog()
        val paris = catalog.destinations.first { it.id == "paris" }
        val three = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-03"), 2, "mid", emptyList()),
            paris,
            catalog.places.associateBy { it.id },
        ) as GenerateResult.Success
        assertEquals(3, three.trip.days.size)
        assertEquals(1, three.trip.days.first().dayIndex)
        assertEquals("2026-12-01", three.trip.days.first().date)
        assertEquals(paris.itineraryTemplates[0].items.size, three.trip.days[0].items.size)
        assertEquals("draft", three.trip.status)

        val ten = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-10"), 2, "mid", emptyList()),
            paris,
            catalog.places.associateBy { it.id },
        ) as GenerateResult.Success
        assertEquals(7, ten.trip.days.size)
        assertEquals("2026-12-01", ten.trip.startDate)
        assertEquals("2026-12-10", ten.trip.endDate)

        val range = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-20"), 2, "mid", emptyList()),
            paris,
            catalog.places.associateBy { it.id },
        )
        assertTrue(range is GenerateResult.RangeTooLong)

        val sorted = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-01"), 2, "mid", listOf("food")),
            paris,
            catalog.places.associateBy { it.id },
        ) as GenerateResult.Success
        val categories = sorted.trip.days.first().items.map { catalog.places.first { place -> place.id == it.placeId }.category }
        val foodFirst = categories.takeWhile { it == "food" } + categories.dropWhile { it == "food" }
        assertEquals(categories, foodFirst)
    }

    @Test
    fun `AC-trip-planner-4 Generate opens the Itinerary screen for the new trip`() {
        compose.launchApp()
        compose.onNodeWithTag("home.featured").performClick()
        compose.onNodeWithTag("city.planTrip").performScrollTo().performClick()
        compose.onNodeWithTag("planner.startDate").performClick()
        compose.onNodeWithText(ApplicationProvider.getApplicationContext<Context>().getString(R.string.common_ok)).performClick()
        compose.onNodeWithTag("planner.endDate").performClick()
        compose.onNodeWithText(ApplicationProvider.getApplicationContext<Context>().getString(R.string.common_ok)).performClick()
        compose.onNodeWithTag("planner.generate").performScrollTo().performClick()
        compose.onNodeWithTag("itinerary.hero").assertIsDisplayed()
    }

    @Test
    fun `AC-trip-planner-5 each itinerary item shows a photograph name start time and duration`() {
        val catalog = loadCatalog()
        val paris = catalog.destinations.first { it.id == "paris" }
        val generated = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-01"), 2, "mid", emptyList()),
            paris,
            catalog.places.associateBy { it.id },
            id = "t1",
            newItemId = { "item-1" },
        ) as GenerateResult.Success
        val trip = generated.trip.copy(
            days = generated.trip.days.map { day ->
                day.copy(items = day.items.take(1).map { it.copy(id = "item-1") })
            },
        )
        compose.launchApp(previewContainer(trips = listOf(trip)))
        compose.onNodeWithText(ApplicationProvider.getApplicationContext<Context>().getString(R.string.tabs_trips)).performClick()
        compose.onNodeWithTag("trips.segment.drafts").performClick()
        compose.onNodeWithTag("trips.card.t1").performClick()
        compose.onNodeWithTag("itinerary.item.item-1").assertExists()
        compose.onNodeWithText("Eiffel Tower", substring = true).assertExists()
    }

    @Test
    fun `AC-trip-planner-6 the traveler can add remove reorder and complete items and the change survives a restart`() = runTest {
        val catalog = catalogRepo()
        val paris = catalog.destination("paris")!!
        val generated = generateTrip(
            GenerateRequest("paris", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-01"), 2, "mid", emptyList()),
            paris,
            catalog.places().associateBy { it.id },
            id = "persist-trip",
        ) as GenerateResult.Success
        val file = File(folder.root, "app.preferences_pb")
        val first = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val repo1 = DataStoreTripRepository(
            PreferenceDataStoreFactory.create(scope = first, produceFile = { file }),
            catalog,
        )
        var trip = generated.trip
        val firstDay = trip.days.first()
        val firstItem = firstDay.items.first()
        val secondItem = firstDay.items[1]
        trip = trip.copy(days = listOf(moveItem(firstDay, secondItem.id, -1)))
        trip = trip.copy(
            days = trip.days.map { day ->
                day.copy(
                    items = day.items.map { if (it.id == firstItem.id) it.copy(completed = true) else it } +
                        emptyList(),
                )
            },
        )
        val removed = trip.copy(days = trip.days.map { it.copy(items = it.items.filterNot { item -> item.id == firstItem.id }) })
        val withAdd = removed.copy(days = removed.days.map { addItemToDay(it, catalog.place("paris-louvre")!!) })
        repo1.upsert(withAdd)
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val repo2 = DataStoreTripRepository(
            PreferenceDataStoreFactory.create(scope = second, produceFile = { file }),
            catalog,
        )
        val stored = repo2.trips.first().first { it.id == "persist-trip" }
        assertTrue(stored.days.first().items.any { it.placeId == "paris-louvre" })
        assertTrue(stored.days.first().items.none { it.id == firstItem.id })
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-trip-planner-7 the budget breakdown equals the lodging food activities formula`() {
        val catalog = loadCatalog()
        val bali = catalog.destinations.first { it.id == "bali" }
        val trip = (generateTrip(
            GenerateRequest("bali", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-03"), 2, "mid", emptyList()),
            bali,
            catalog.places.associateBy { it.id },
        ) as GenerateResult.Success).trip
        val budget = estimateBudget(bali, "mid", trip.days.size, 2)
        val estimates = bali.budgetEstimates.getValue("mid")
        assertEquals(estimates.lodging * 3, budget.lodging)
        assertEquals(estimates.food * 3 * 2, budget.food)
        assertEquals(estimates.activities * 3 * 2, budget.activities)
        assertEquals(budget.lodging + budget.food + budget.activities, budget.total)
    }

    @Test
    fun `AC-profile-2 usual travelers budget and favorite categories persist and prefill Trip planner`() = runTest {
        val catalog = catalogRepo()
        val profile = InMemoryProfileRepository(
            ProfileData(defaultTravelers = 4, budgetBand = "luxury", preferredCategories = listOf("food")),
        )
        val viewModel = TripPlannerViewModel(catalog, InMemoryTripRepository(catalog = catalog), profile)
        viewModel.uiState.first { it.travelers == 4 }
        assertEquals(4, viewModel.uiState.value.travelers)
        assertEquals("luxury", viewModel.uiState.value.budgetBand)
        assertEquals(listOf("food"), viewModel.uiState.value.interests)
    }
}
