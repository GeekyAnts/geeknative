package app.features.venues

import android.content.Context
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.core.navigation.AppNavigation
import app.features.catalog.VenueFilters
import app.features.catalog.WeddingCatalog
import app.features.catalog.filterVenues
import app.features.catalog.toggled
import app.features.wedding.InMemoryWeddingRepository
import app.features.wedding.currentPlan
import app.features.wedding.updatePlan
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class VenuesTest {
    @get:Rule
    val compose = createComposeRule()

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    /** The caption and the empty-field placeholder share one string, so match the editable field. */
    private fun typeInto(label: String, value: String) {
        compose.onNode(hasSetTextAction() and hasText(label)).performTextInput(value)
    }

    @Test
    fun `AC-venues-1 shows every catalog venue when no filter is applied`() {
        assertEquals(WeddingCatalog.venues.size, filterVenues(VenueFilters()).size)
    }

    @Test
    fun `AC-venues-2 filtering by destination shows only that destination's venues`() {
        val results = filterVenues(VenueFilters(destinationId = "udaipur"))
        assertTrue(results.all { it.destinationId == "udaipur" })
        assertTrue(results.any { it.id == "udaipur-taj-lake" })
    }

    @Test
    fun `AC-venues-3 venue detail shows capacity, from-price and amenities`() {
        val venue = WeddingCatalog.venueById("udaipur-taj-lake")!!
        assertEquals(180, venue.capacity)
        assertEquals(120000, venue.priceFrom)
        assertTrue(venue.amenities.isNotEmpty())
    }

    @Test
    fun `AC-venues-4 submitting a valid enquiry shows the success message`() {
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides AppContainer.preview()) {
                AppTheme(darkTheme = false) { AppNavigation() }
            }
        }
        compose.onNodeWithText(string(R.string.nav_venues)).performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("venues.card.udaipur-taj-lake").performScrollTo().performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("venues.enquireCta").performScrollTo().performClick()
        compose.onNodeWithTag("venues.enquireForm").assertIsDisplayed()
        typeInto(string(R.string.venues_enquire_name), "Meera and Arjun")
        typeInto(string(R.string.venues_enquire_email), "couple@example.com")
        typeInto(string(R.string.venues_enquire_message), "A palace wedding in winter.")
        compose.onNodeWithTag("venues.enquireSubmit").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag("venues.enquireSuccess").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText(string(R.string.venues_enquire_success)).assertIsDisplayed()
    }

    @Test
    fun `AC-venues-5 saving a venue adds its id to the wedding plan`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.updatePlan { plan -> plan.copy(savedVenueIds = plan.savedVenueIds.toggled("udaipur-taj-lake")) }
        assertTrue(repository.currentPlan().savedVenueIds.contains("udaipur-taj-lake"))
    }
}
