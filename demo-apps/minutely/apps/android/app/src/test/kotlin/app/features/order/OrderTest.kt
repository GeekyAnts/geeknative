package app.features.order

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.R
import app.core.AppContainer
import app.core.LocalAppContainer
import app.core.designsystem.AppTheme
import app.features.cart.CartLine
import app.features.catalog.LocalCatalogRepository
import app.generated.AppConfig
import app.testing.string
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import androidx.compose.runtime.CompositionLocalProvider
import app.core.navigation.AppNavigation

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h914dp")
class OrderTest {
    @get:Rule
    val compose = createComposeRule()

    @get:Rule
    val folder = TemporaryFolder()

    private val catalog = LocalCatalogRepository()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun order(placedAt: Long) = Order.place(listOf(CartLine("banana", 2), CartLine("milk", 1)), catalog, placedAt)

    @Test
    fun `AC-order-1 the id is MN and placedAt mod 1000000 zero-padded to 6 digits`() {
        assertEquals("MN123456", Order.idFor(1761800123456))
        assertEquals("MN000042", Order.idFor(1761800000042))
        assertEquals("MN000000", Order.idFor(1761800000000))
        assertEquals("MN123456", order(1761800123456).id)
    }

    @Test
    fun `AC-order-2 orders survive a restart under orders_history, newest first, at most 20`() = runTest {
        val file = File(folder.root, "orders.preferences_pb")
        val key = stringPreferencesKey("orders.history")

        val first = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val store = PreferenceDataStoreFactory.create(scope = first, produceFile = { file })
        val repository = DataStoreOrdersRepository(store)
        (1..22).forEach { repository.save(order(1761800000000L + it)) }

        // Exactly the spec's field names.
        val stored = Json.parseToJsonElement(store.data.first()[key]!!).jsonArray
        assertEquals(20, stored.size)
        assertEquals(
            setOf("id", "placedAt", "lines", "itemCount", "itemTotal", "savings", "deliveryFee", "toPay"),
            stored[0].jsonObject.keys,
        )
        assertEquals(
            setOf("productId", "name", "unit", "emoji", "categoryId", "price", "mrp", "quantity"),
            stored[0].jsonObject["lines"]!!.jsonArray[0].jsonObject.keys,
        )
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val secondStore = PreferenceDataStoreFactory.create(scope = second, produceFile = { file })
        val restored = DataStoreOrdersRepository(secondStore)
        assertEquals(order(1761800000022L), restored.order("MN000022"))
        assertEquals("MN000003", restored.order("MN000003")?.id)
        assertNull(restored.order("MN000002")) // the oldest two were dropped
        assertNull(restored.order("MN000001"))

        secondStore.edit { it[key] = "{broken" }
        assertNull(restored.order("MN000022"))
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    private fun showOrder(orderId: String, orders: OrdersRepository) {
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides AppContainer.preview(ordersRepository = orders)) {
                AppTheme(darkTheme = false) {
                    OrderPlacedScreen(OrderPlacedViewModel(orders, orderId), onBack = {}, onContinueShopping = {})
                }
            }
        }
    }

    @Test
    fun `AC-order-3 Order placed shows the number, delivery time, each line and the total`() {
        val placed = order(1761800123456)
        showOrder(placed.id, InMemoryOrdersRepository(listOf(placed)))

        compose.onNodeWithTag("order.number").assertTextEquals(string(R.string.order_number, "MN123456"))
        compose.onNodeWithText(string(R.string.order_placed_body, AppConfig.deliveryMinutes)).assertIsDisplayed()
        compose.onNodeWithTag("order.line.banana").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("order.line.milk").performScrollTo().assertIsDisplayed()
        val banana = LocalCatalogRepository().product("banana")!!
        val inBananaLine = hasAnyAncestor(hasTestTag("order.line.banana"))
        compose.onNode(hasText(string(R.string.order_line_quantity, banana.name, 2)) and inBananaLine).assertExists()
        compose.onNode(hasText(banana.unit) and inBananaLine).assertExists()
        compose.onNodeWithTag("order.total").performScrollTo().assertTextEquals(string(R.string.common_price, 151))
    }

    @Test
    fun `AC-order-4 an unknown order id shows the not-found state`() {
        showOrder("MN999999", InMemoryOrdersRepository())
        compose.onNodeWithTag("order.notFound").assertIsDisplayed()
        compose.onNodeWithText(string(R.string.order_not_found_title)).assertIsDisplayed()
    }

    @Test
    fun `AC-order-5 Continue shopping returns to Home`() {
        val container = AppContainer.preview(
            cartRepository = app.features.cart.InMemoryCartRepository(listOf(CartLine("apple", 1))),
            clock = { 1761800123456 },
        )
        compose.setContent {
            CompositionLocalProvider(LocalAppContainer provides container) {
                AppTheme(darkTheme = false) { AppNavigation() }
            }
        }
        compose.onNodeWithTag("home.search").performClick()
        compose.onNodeWithTag("cartBar").performClick()
        compose.onNodeWithTag("cart.placeOrder").performClick()

        compose.onNodeWithTag("order.continueShopping").performScrollTo().performClick()

        compose.onNodeWithTag("home.delivery").assertIsDisplayed()
        compose.onNodeWithTag("cartBar").assertDoesNotExist()
    }
}
