package app.core

import app.core.navigation.Route
import app.features.settings.Appearance
import org.junit.Assert.assertEquals
import org.junit.Test

class ScreenshotLaunchTest {
    @Test
    fun eachShotOpensItsOwnScreen() {
        assertEquals(listOf(Route.Home), launch("home").backStack())
        assertEquals(listOf(Route.Home, Route.Destinations), launch("destinations").backStack())
        assertEquals(
            listOf(Route.Home, Route.Destinations, Route.DestinationDetail("udaipur")),
            launch("udaipur").backStack(),
        )
        assertEquals(
            listOf(Route.Home, Route.Venues, Route.VenueDetail("udaipur-taj-lake")),
            launch("venue").backStack(),
        )
        assertEquals(listOf(Route.Home, Route.Wedding), launch("wedding").backStack())
    }

    @Test
    fun detailIdsComeFromTheLaunchExtras() {
        val launch = ScreenshotLaunch("venue", Appearance.Dark, destinationId = "santorini", venueId = "santorini-canaves")
        assertEquals(listOf(Route.Home, Route.Venues, Route.VenueDetail("santorini-canaves")), launch.backStack())
        assertEquals("santorini", launch.plan().destinationId)
        assertEquals("santorini-canaves", launch.plan().venueId)
    }

    private fun launch(screen: String) = ScreenshotLaunch(screen, Appearance.Light)
}
