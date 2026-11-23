package app.features.cart

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import app.R
import app.features.catalog.LocalCatalogRepository
import app.core.AppContainer
import app.features.order.InMemoryOrdersRepository
import app.testing.launchApp
import app.testing.plural
import app.testing.string
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
// Tall enough to hold all of Home: scrolling to a card inside the nested bestsellers rail is unreliable in Robolectric.
@Config(sdk = [35], qualifiers = "w411dp-h1800dp")
class CartScreenTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun `AC-cart-5 the cart bar shows only with items, with count and total, and opens Cart`() {
        compose.launchApp()
        compose.onNodeWithTag("cartBar").assertDoesNotExist()

        compose.onNodeWithTag("product.banana.add").performScrollTo().performClick()
        compose.onNodeWithTag("product.banana.increase").performClick()
        compose.onNodeWithTag("product.milk.add").performScrollTo().performClick()

        compose.onNodeWithTag("cartBar").assertIsDisplayed()
        compose.onNode(hasText(plural(R.plurals.common_item_count, 3)), useUnmergedTree = true).assertIsDisplayed()
        compose.onNode(hasText(string(R.string.common_price, 126)), useUnmergedTree = true).assertIsDisplayed()

        compose.onNodeWithTag("cartBar").performClick()
        compose.onNodeWithText(string(R.string.cart_title)).assertIsDisplayed()
        compose.onNodeWithTag("cart.line.banana").assertIsDisplayed()

        // Emptying the cart from its lines shows the empty state.
        compose.onNodeWithTag("product.milk.decrease").performClick()
        compose.onNodeWithTag("product.banana.decrease").performClick()
        compose.onNodeWithTag("product.banana.decrease").performClick()
        compose.onNodeWithTag("cart.empty").assertIsDisplayed()
    }

    @Test
    fun `AC-cart-4 the bill shows the worked example's totals`() {
        compose.launchApp(AppContainer.preview(cartRepository = InMemoryCartRepository(listOf(CartLine("banana", 2), CartLine("milk", 1)))))
        compose.onNodeWithTag("home.openCart").performClick()

        compose.onNodeWithTag("cart.itemTotal").performScrollTo().assertTextEquals(string(R.string.common_price, 126))
        compose.onNodeWithTag("cart.deliveryFee").assertTextEquals(string(R.string.common_price, 25))
        compose.onNodeWithTag("cart.toPay").assertTextEquals(string(R.string.common_price, 151))
        compose.onNodeWithTag("cart.freeDelivery").assertTextEquals(string(R.string.cart_free_delivery_nudge, 73))
        compose.onNodeWithTag("cart.savings").assertExists()

        compose.onNodeWithTag("product.banana.increase").performScrollTo().performClick()
        compose.onNodeWithTag("product.banana.increase").performClick()
        compose.onNodeWithTag("product.banana.increase").performClick()
        compose.onNodeWithTag("cart.deliveryFee").performScrollTo().assertTextEquals(string(R.string.cart_free))
        compose.onNodeWithTag("cart.freeDelivery").assertTextEquals(string(R.string.cart_free_delivery_unlocked))
    }

    @Test
    fun `AC-cart-4 the item total shows the price first, then the struck MRP total`() {
        val lines = listOf(CartLine("banana", 2), CartLine("milk", 1))
        val summary = CartSummary.of(lines, LocalCatalogRepository(), 199, 25)
        assertTrue(summary.savings > 0)
        compose.launchApp(AppContainer.preview(cartRepository = InMemoryCartRepository(lines)))
        compose.onNodeWithTag("home.openCart").performClick()

        val price = compose.onNodeWithTag("cart.itemTotal").performScrollTo().getUnclippedBoundsInRoot()
        val mrp = compose.onNodeWithContentDescription(string(R.string.common_mrp, summary.mrpTotal))
            .assertIsDisplayed()
            .getUnclippedBoundsInRoot()
        assertTrue(price.right <= mrp.left)
    }

    @Test
    fun `AC-cart-6 an empty Cart shows the empty state and Start shopping returns to Home`() {
        compose.launchApp()
        compose.onNodeWithTag("home.openCart").performClick()

        compose.onNodeWithTag("cart.empty").assertIsDisplayed()
        compose.onNodeWithTag("cart.startShopping").performClick()

        compose.onNodeWithTag("home.delivery").assertIsDisplayed()
    }

    @Test
    fun `AC-cart-7 Place order saves the order, empties the cart and opens Order placed`() {
        val cart = InMemoryCartRepository(listOf(CartLine("banana", 2), CartLine("milk", 1)))
        val orders = InMemoryOrdersRepository()
        compose.launchApp(AppContainer.preview(cartRepository = cart, ordersRepository = orders, clock = { 1761800123456 }))

        compose.onNodeWithTag("home.openCart").performClick()
        compose.onNodeWithTag("cart.placeOrder").performClick()

        compose.onNodeWithTag("order.number").assertTextEquals(string(R.string.order_number, "MN123456"))
        assertEquals(listOf("MN123456"), orders.orders.map { it.id })
        runTest { assertTrue(cart.lines.first().isEmpty()) }

        // Order placed replaced Cart: Back returns to Home, not to an empty cart.
        compose.onNodeWithContentDescription(string(R.string.common_back)).performClick()
        compose.onNodeWithTag("home.delivery").assertIsDisplayed()
    }
}
