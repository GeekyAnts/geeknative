package app.features.packages

import app.features.catalog.WeddingCatalog
import app.features.catalog.budgetBreakdown
import app.features.wedding.InMemoryWeddingRepository
import app.features.wedding.currentPlan
import app.features.wedding.updatePlan
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PackagesTest {
    @Test
    fun `AC-packages-1 shows Intimate, Grand, Royal Luxury and Bespoke`() {
        assertEquals(listOf("intimate", "grand", "royal", "bespoke"), WeddingCatalog.packages.map { it.id })
    }

    @Test
    fun `AC-packages-2 changing guest count updates the displayed total`() {
        val pack = WeddingCatalog.packages.first()
        val small = budgetBreakdown(pack, pack.includedGuests, emptyList())
        val large = budgetBreakdown(pack, pack.includedGuests + 10, emptyList())
        assertEquals(small.total + 10 * pack.extraGuestPrice, large.total)
        assertTrue(large.catering > small.catering)
    }

    @Test
    fun `AC-packages-3 selecting a package stores its id on the wedding plan`() = runTest {
        val repository = InMemoryWeddingRepository()
        repository.updatePlan { it.copy(packageId = "royal", budget = 280000) }
        assertEquals("royal", repository.currentPlan().packageId)
    }
}
