package app.features.wedding

import app.features.catalog.WeddingCatalog
import app.features.catalog.WeddingPlan
import app.features.catalog.daysRemaining
import app.features.catalog.toggled
import java.time.LocalDate
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WeddingTest {
    @Test
    fun `AC-wedding-1 with a future date stored shows the number of days remaining`() {
        val today = LocalDate.parse("2026-11-06")
        assertEquals(10, daysRemaining("2026-11-16", today))
        assertEquals(0, daysRemaining("2026-11-06", today))
    }

    @Test
    fun `AC-wedding-2 shows the selected destination and venue names when those ids are set`() = runTest {
        val repository = InMemoryWeddingRepository(
            WeddingPlan.Empty.copy(destinationId = "udaipur", venueId = "udaipur-taj-lake"),
        )
        val plan = repository.currentPlan()
        assertEquals("Udaipur", WeddingCatalog.destinationById(plan.destinationId)?.name)
        assertEquals("Taj Lake Palace", WeddingCatalog.venueById(plan.venueId)?.name)
    }

    @Test
    fun `AC-wedding-3 toggling a task persists it as completed after a reload`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.updatePlan { it.copy(completedTaskIds = it.completedTaskIds.toggled("venue")) }
        assertTrue(repository.currentPlan().completedTaskIds.contains("venue"))
    }

    @Test
    fun `AC-wedding-4 saved destinations on the plan appear in the saved list`() = runTest {
        val repository = InMemoryWeddingRepository(WeddingPlan.Empty.copy(savedDestinationIds = listOf("santorini")))
        assertEquals(listOf("santorini"), repository.currentPlan().savedDestinationIds)
    }

    @Test
    fun `AC-wedding-5 changing guest count persists on the wedding plan`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.updatePlan { it.copy(guestCount = 120) }
        assertEquals(120, repository.currentPlan().guestCount)
    }
}
