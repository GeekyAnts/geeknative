package app.features.destinations

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.viewmodel.compose.viewModel
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.features.catalog.DestinationFilters
import app.features.catalog.WeddingCatalog
import app.features.catalog.filterDestinations
import app.features.catalog.toggled
import app.features.wedding.InMemoryWeddingRepository
import app.features.wedding.currentPlan
import app.features.wedding.updatePlan
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class DestinationsTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun `AC-destinations-1 shows every catalog destination when no filter is applied`() {
        assertEquals(WeddingCatalog.destinations.size, filterDestinations(DestinationFilters()).size)
    }

    @Test
    fun `AC-destinations-2 choosing a style hides destinations that do not include that style`() {
        val results = filterDestinations(DestinationFilters(style = "beach"))
        assertTrue(results.isNotEmpty())
        assertTrue(results.all { "beach" in it.styles })
        assertFalse(results.any { it.id == "udaipur" })
    }

    @Test
    fun `AC-destinations-3 a guest count hides destinations whose maximum capacity is below it`() {
        val results = filterDestinations(DestinationFilters(guests = 300))
        assertTrue(results.all { it.guestCapacityMax >= 300 })
        assertFalse(results.any { it.id == "santorini" })
    }

    @Test
    fun `AC-destinations-4 opening a destination shows its name and description`() {
        val destination = WeddingCatalog.destinationById("udaipur")!!
        val container = AppContainer.preview()
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides container) {
                AppTheme(darkTheme = false) {
                    DestinationDetailScreen(
                        viewModel = viewModel { DestinationDetailViewModel("udaipur", container.weddingRepository) },
                        onBack = {},
                        onOpenVenue = {},
                    )
                }
            }
        }
        compose.onAllNodesWithText(destination.name)[0].assertIsDisplayed()
        compose.onNodeWithText("Lake Pichola", substring = true).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `AC-destinations-5 saving a destination adds its id to the wedding plan`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.updatePlan { plan -> plan.copy(savedDestinationIds = plan.savedDestinationIds.toggled("udaipur")) }
        assertTrue(repository.currentPlan().savedDestinationIds.contains("udaipur"))
    }
}
