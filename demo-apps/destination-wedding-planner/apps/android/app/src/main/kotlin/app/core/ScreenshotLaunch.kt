package app.core

import android.content.Intent
import app.core.navigation.Route
import app.features.catalog.BookingStatus
import app.features.catalog.WeddingPlan
import app.features.settings.Appearance

/**
 * Intent extras that open a named screen for screenshot capture.
 *
 * - `screenshotScreen`: screen id from previews/shots.json
 * - `screenshotAppearance`: `light` or `dark`
 * - `screenshotDestinationId` / `screenshotVenueId`: which detail to open
 */
data class ScreenshotLaunch(
    val screen: String,
    val appearance: Appearance,
    val destinationId: String = DEFAULT_DESTINATION_ID,
    val venueId: String = DEFAULT_VENUE_ID,
) {
    /** Back stack for this screen. Home stays underneath a tab, matching a normal navigation. */
    fun backStack(): List<Route> = when (screen) {
        "destinations" -> listOf(Route.Home, Route.Destinations)
        "venues" -> listOf(Route.Home, Route.Venues)
        "experiences" -> listOf(Route.Home, Route.Experiences)
        "packages" -> listOf(Route.Home, Route.Packages)
        "wedding" -> listOf(Route.Home, Route.Wedding)
        "settings" -> listOf(Route.Home, Route.Settings)
        "udaipur" -> listOf(Route.Home, Route.Destinations, Route.DestinationDetail(destinationId))
        "venue" -> listOf(Route.Home, Route.Venues, Route.VenueDetail(venueId))
        else -> listOf(Route.Home)
    }

    /** The same plan the web shots seed in localStorage, so the wedding screen is not empty. */
    fun plan(): WeddingPlan = WeddingPlan(
        date = "2027-02-14",
        destinationId = destinationId,
        venueId = venueId,
        guestCount = 120,
        budget = 180000,
        packageId = "royal",
        bookingStatus = BookingStatus.EnquirySent.id,
        savedDestinationIds = listOf(destinationId, "santorini"),
        savedVenueIds = listOf(venueId),
        completedTaskIds = listOf("venue"),
        selectedExperienceIds = listOf("photography", "florals"),
    )

    companion object {
        const val SCREEN_EXTRA = "screenshotScreen"
        const val APPEARANCE_EXTRA = "screenshotAppearance"
        const val DESTINATION_EXTRA = "screenshotDestinationId"
        const val VENUE_EXTRA = "screenshotVenueId"

        const val DEFAULT_DESTINATION_ID = "udaipur"
        const val DEFAULT_VENUE_ID = "udaipur-taj-lake"

        fun from(intent: Intent?): ScreenshotLaunch? {
            val screen = intent?.getStringExtra(SCREEN_EXTRA)?.takeIf { it.isNotBlank() } ?: return null
            return ScreenshotLaunch(
                screen = screen,
                appearance = Appearance.fromId(intent.getStringExtra(APPEARANCE_EXTRA)),
                destinationId = intent.getStringExtra(DESTINATION_EXTRA) ?: DEFAULT_DESTINATION_ID,
                venueId = intent.getStringExtra(VENUE_EXTRA) ?: DEFAULT_VENUE_ID,
            )
        }
    }
}
