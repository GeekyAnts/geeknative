package app.core

import android.content.Intent
import app.core.designsystem.Tab
import app.core.navigation.Route
import app.core.storage.InMemoryKeyValueStore
import app.features.auth.KeyValueAuthRepository
import app.features.reservation.KeyValueReservationsRepository
import app.features.saved.KeyValueSavedRepository
import app.features.settings.Appearance
import java.time.Clock
import java.time.LocalDateTime
import java.time.ZoneId
import org.json.JSONArray
import org.json.JSONObject

/**
 * Intent extras that open a named screen for screenshot capture.
 *
 * - `screenshotScreen`: screen id from previews/shots.json
 * - `screenshotAppearance`: `light` or `dark`
 */
data class ScreenshotLaunch(
    val screen: String,
    val appearance: Appearance,
    val restaurantId: String = MEMBER_RESTAURANT_ID,
    val reservationId: String = UPCOMING_RESERVATION_ID,
) {
    val signedIn: Boolean get() = screen !in SIGNED_OUT

    val tab: Tab?
        get() = Tab.entries.find { it.name.equals(screen, ignoreCase = true) }

    fun signedOutStack(): List<Route> = when (screen) {
        "sign-in", "signIn" -> listOf(Route.Welcome, Route.SignIn)
        "sign-up", "signUp" -> listOf(Route.Welcome, Route.SignUp)
        else -> listOf(Route.Welcome)
    }

    fun signedInStack(): List<Route> {
        val extra = when (screen) {
            "restaurant" -> Route.Restaurant(restaurantId)
            "reserve" -> Route.Reserve(restaurantId)
            "confirmation" -> Route.Confirmation(reservationId)
            "reservation" -> Route.Reservation(reservationId)
            "notifications" -> Route.Notifications
            "preferences" -> Route.Preferences
            "help" -> Route.Help
            "settings" -> Route.Settings
            else -> null
        }
        return listOfNotNull(Route.Tabs, extra)
    }

    fun seedStore(): InMemoryKeyValueStore {
        val email = MEMBER_EMAIL
        val values = mutableMapOf<String, String>()
        if (signedIn) {
            values[KeyValueAuthRepository.ACCOUNTS_KEY] = JSONArray().put(
                JSONObject()
                    .put("name", MEMBER_NAME)
                    .put("email", email)
                    .put("passwordHash", KeyValueAuthRepository.passwordHash(email, MEMBER_PASSWORD))
                    .put("createdAt", MEMBER_CREATED_AT),
            ).toString()
            values[KeyValueAuthRepository.SESSION_KEY] = email
            values[KeyValueReservationsRepository.key(email)] = sampleReservationsJson()
            values[KeyValueSavedRepository.key(email)] = JSONArray().put(MEMBER_RESTAURANT_ID).toString()
        }
        return InMemoryKeyValueStore(values)
    }

    companion object {
        const val SCREEN_EXTRA = "screenshotScreen"
        const val APPEARANCE_EXTRA = "screenshotAppearance"
        const val RESTAURANT_EXTRA = "screenshotRestaurantId"
        const val RESERVATION_EXTRA = "screenshotReservationId"

        const val MEMBER_NAME = "Aarav Mehta"
        const val MEMBER_EMAIL = "aarav@example.com"
        const val MEMBER_PASSWORD = "password1"
        const val MEMBER_CREATED_AT = "2025-03-14T10:00:00Z"
        const val MEMBER_RESTAURANT_ID = "koyo"
        const val UPCOMING_RESERVATION_ID = "6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60"
        const val PAST_RESERVATION_ID = "0a9b8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d"

        private val SIGNED_OUT = setOf("welcome", "sign-in", "signIn", "sign-up", "signUp")

        fun from(intent: Intent?): ScreenshotLaunch? {
            val screen = intent?.getStringExtra(SCREEN_EXTRA)?.takeIf { it.isNotBlank() } ?: return null
            return ScreenshotLaunch(
                screen = screen,
                appearance = Appearance.fromId(intent.getStringExtra(APPEARANCE_EXTRA)),
                restaurantId = intent.getStringExtra(RESTAURANT_EXTRA) ?: MEMBER_RESTAURANT_ID,
                reservationId = intent.getStringExtra(RESERVATION_EXTRA) ?: UPCOMING_RESERVATION_ID,
            )
        }

        /** Wednesday 18 November 2026, 15:00 local time, matching iOS UITesting. */
        fun clock(): Clock {
            val zone = ZoneId.systemDefault()
            return Clock.fixed(LocalDateTime.of(2026, 11, 18, 15, 0).atZone(zone).toInstant(), zone)
        }

        private fun sampleReservationsJson(): String = JSONArray()
            .put(
                JSONObject()
                    .put("id", UPCOMING_RESERVATION_ID)
                    .put("confirmationCode", "DC-7KQ2MX")
                    .put("restaurantId", MEMBER_RESTAURANT_ID)
                    .put("date", "2026-11-20")
                    .put("time", "21:30")
                    .put("partySize", 2)
                    .put("seating", "indoor")
                    .put("occasion", "anniversary")
                    .put("dietary", JSONArray().put("vegetarian"))
                    .put("notes", "")
                    .put("status", "confirmed")
                    .put("createdAt", "2026-11-10T09:00:00Z")
                    .put("updatedAt", "2026-11-10T09:00:00Z"),
            )
            .put(
                JSONObject()
                    .put("id", PAST_RESERVATION_ID)
                    .put("confirmationCode", "DC-H4PZ9R")
                    .put("restaurantId", "maison-lumiere")
                    .put("date", "2026-10-10")
                    .put("time", "20:00")
                    .put("partySize", 4)
                    .put("seating", "window")
                    .put("occasion", "none")
                    .put("dietary", JSONArray())
                    .put("notes", "")
                    .put("status", "confirmed")
                    .put("createdAt", "2026-10-01T09:00:00Z")
                    .put("updatedAt", "2026-10-01T09:00:00Z"),
            )
            .toString()
    }
}
