package app.features.experiences

import app.features.catalog.Enquiry
import app.features.catalog.WeddingCatalog
import app.features.wedding.InMemoryWeddingRepository
import app.features.wedding.currentPlan
import app.features.wedding.updatePlan
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExperiencesTest {
    @Test
    fun `AC-experiences-1 Experiences shows every catalog service`() {
        assertEquals(10, WeddingCatalog.experiences.size)
        assertEquals(
            listOf(
                "photography",
                "florals",
                "catering",
                "planner",
                "makeup",
                "entertainment",
                "accommodation",
                "transport",
                "prewedding",
                "rituals",
            ),
            WeddingCatalog.experiences.map { it.id },
        )
    }

    @Test
    fun `AC-experiences-2 submitting a valid experience enquiry records it and selects that experience`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.addEnquiry(
            Enquiry(
                id = "1",
                venueId = "",
                experienceId = "photography",
                coupleName = "A & B",
                email = "a@b.com",
                date = "",
                guests = 0,
                message = "Please",
                createdAt = "2026-01-01",
            ),
        )
        repository.updatePlan { it.copy(selectedExperienceIds = listOf("photography")) }
        assertEquals("photography", repository.enquiries.first()[0].experienceId)
        assertTrue(repository.currentPlan().selectedExperienceIds.contains("photography"))
    }
}
