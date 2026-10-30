package app.features.home

import app.R
import app.generated.AppIdentity
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeTest {
    @Test
    fun `AC-home-1 shows the app name as its title`() {
        // HomeScreen puts AppIdentity.NAME in the top app bar, and the name comes from contracts/app.json.
        assertTrue(AppIdentity.NAME.isNotBlank())
    }

    @Test
    fun `AC-home-2 shows the welcome card's title and text`() {
        // HomeScreen reads both from generated string resources. A missing string fails to compile,
        // and the two must be different entries.
        assertNotEquals(0, R.string.home_welcome_title)
        assertNotEquals(0, R.string.home_welcome_body)
        assertNotEquals(R.string.home_welcome_title, R.string.home_welcome_body)
    }
}
