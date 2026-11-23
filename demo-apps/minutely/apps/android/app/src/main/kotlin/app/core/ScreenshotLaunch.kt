package app.core

import android.content.Intent
import app.core.navigation.Route
import app.features.cart.CartLine
import app.features.order.Order
import app.features.order.OrderLine
import app.features.settings.Appearance

/**
 * Intent extras that open a named screen for screenshot capture.
 *
 * - `screenshotScreen`: screen id from previews/shots.json
 * - `screenshotAppearance`: `light` or `dark`
 * - `screenshotCategoryId` / `screenshotOrderId`: which category and order to open
 */
data class ScreenshotLaunch(
    val screen: String,
    val appearance: Appearance,
    val categoryId: String = DEFAULT_CATEGORY_ID,
    val orderId: String = DEFAULT_ORDER_ID,
) {
    /** Home stays underneath a pushed screen, matching a normal navigation. */
    fun backStack(): List<Route> = when (screen) {
        "category" -> listOf(Route.Home, Route.Category(categoryId))
        "search" -> listOf(Route.Home, Route.Search)
        "cart" -> listOf(Route.Home, Route.Cart)
        "order-placed" -> listOf(Route.Home, Route.OrderPlaced(orderId))
        "settings" -> listOf(Route.Home, Route.Settings)
        else -> listOf(Route.Home)
    }

    /** Bananas and milk, the same cart the web shots store under `cart.items`. */
    fun cartLines(): List<CartLine> = listOf(
        CartLine("banana", 2),
        CartLine("milk", 1),
    )

    fun order(): Order = Order(
        id = orderId,
        placedAt = PLACED_AT,
        lines = listOf(
            OrderLine("banana", "Robusta Banana", "6 pcs", "🍌", "fruits", 49, 60, 2),
            OrderLine("milk", "Toned Milk", "500 ml", "🥛", "dairy", 28, 28, 1),
        ),
        itemCount = 3,
        itemTotal = 126,
        savings = 22,
        deliveryFee = 25,
        toPay = 151,
    )

    companion object {
        const val SCREEN_EXTRA = "screenshotScreen"
        const val APPEARANCE_EXTRA = "screenshotAppearance"
        const val CATEGORY_EXTRA = "screenshotCategoryId"
        const val ORDER_EXTRA = "screenshotOrderId"

        const val DEFAULT_CATEGORY_ID = "fruits"
        const val DEFAULT_ORDER_ID = "MN123456"

        /** 1761800123456 % 1_000_000 is 123456, so the order id is MN123456. */
        const val PLACED_AT = 1_761_800_123_456L

        fun from(intent: Intent?): ScreenshotLaunch? {
            val screen = intent?.getStringExtra(SCREEN_EXTRA)?.takeIf { it.isNotBlank() } ?: return null
            return ScreenshotLaunch(
                screen = screen,
                appearance = Appearance.fromId(intent.getStringExtra(APPEARANCE_EXTRA)),
                categoryId = intent.getStringExtra(CATEGORY_EXTRA) ?: DEFAULT_CATEGORY_ID,
                orderId = intent.getStringExtra(ORDER_EXTRA) ?: DEFAULT_ORDER_ID,
            )
        }
    }
}
