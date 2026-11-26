package app.features.cart

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import app.features.catalog.LocalCatalogRepository
import app.features.order.InMemoryOrdersRepository
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

@OptIn(ExperimentalCoroutinesApi::class)
class CartTest {
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

    private fun dataStore(file: File, scope: CoroutineScope) =
        PreferenceDataStoreFactory.create(scope = scope, produceFile = { file })

    @Test
    fun `AC-cart-1 add appends or increases, remove decreases and drops the line at 0`() = runTest {
        val cart = InMemoryCartRepository()
        cart.add("banana")
        cart.add("milk")
        cart.add("banana")
        assertEquals(listOf(CartLine("banana", 2), CartLine("milk", 1)), cart.lines.first())
        assertEquals(2, cart.quantity("banana"))
        assertEquals(0, cart.quantity("apple"))

        cart.remove("banana")
        assertEquals(listOf(CartLine("banana", 1), CartLine("milk", 1)), cart.lines.first())
        cart.remove("banana")
        assertEquals(listOf(CartLine("milk", 1)), cart.lines.first())
        cart.remove("apple") // not in the cart: nothing happens
        assertEquals(listOf(CartLine("milk", 1)), cart.lines.first())

        cart.clear()
        assertEquals(emptyList<CartLine>(), cart.lines.first())
    }

    @Test
    fun `AC-cart-2 the cart survives a restart as JSON under cart_items`() = runTest {
        val file = File(folder.root, "cart.preferences_pb")

        val first = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val store = dataStore(file, first)
        DataStoreCartRepository(store, catalog).apply {
            add("banana")
            add("banana")
            add("milk")
        }
        assertEquals(
            """[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1}]""",
            store.data.first()[stringPreferencesKey("cart.items")],
        )
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val restored = DataStoreCartRepository(dataStore(file, second), catalog)
        assertEquals(listOf(CartLine("banana", 2), CartLine("milk", 1)), restored.lines.first())
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-cart-2 unknown products, quantities below 1 and unreadable data are dropped`() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val store = dataStore(File(folder.root, "cart.preferences_pb"), scope)
        val cart = DataStoreCartRepository(store, catalog)
        val key = stringPreferencesKey(CartLines.STORAGE_KEY)

        store.edit {
            it[key] = """[{"productId":"banana","quantity":2},{"productId":"unicorn","quantity":1},""" +
                """{"productId":"milk","quantity":0},{"productId":"eggs","quantity":-3},{"productId":"bread","quantity":1}]"""
        }
        assertEquals(listOf(CartLine("banana", 2), CartLine("bread", 1)), cart.lines.first())

        store.edit { it[key] = "not json" }
        assertEquals(emptyList<CartLine>(), cart.lines.first())

        // Adding to unreadable data starts a fresh cart.
        cart.add("apple")
        assertEquals(listOf(CartLine("apple", 1)), cart.lines.first())
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-cart-2 duplicate lines for one product are merged by adding quantities`() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val store = dataStore(File(folder.root, "cart.preferences_pb"), scope)
        val cart = DataStoreCartRepository(store, catalog)
        val key = stringPreferencesKey(CartLines.STORAGE_KEY)

        store.edit {
            it[key] = """[{"productId":"banana","quantity":2},{"productId":"milk","quantity":1},{"productId":"banana","quantity":1}]"""
        }
        assertEquals(listOf(CartLine("banana", 3), CartLine("milk", 1)), cart.lines.first())

        // Invalid lines are dropped before merging, so they add nothing.
        store.edit {
            it[key] = """[{"productId":"milk","quantity":0},{"productId":"banana","quantity":1},""" +
                """{"productId":"milk","quantity":2},{"productId":"banana","quantity":-4},{"productId":"unicorn","quantity":1}]"""
        }
        assertEquals(listOf(CartLine("banana", 1), CartLine("milk", 2)), cart.lines.first())

        // The next write stores the merged lines.
        cart.add("milk")
        assertEquals("""[{"productId":"banana","quantity":1},{"productId":"milk","quantity":3}]""", store.data.first()[key])
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-cart-3 item count, item total, MRP total and savings follow the rules`() {
        val summary = CartSummary.of(listOf(CartLine("banana", 2), CartLine("milk", 1)), catalog, 199, 25)
        assertEquals(3, summary.itemCount)
        assertEquals(126, summary.itemTotal)
        assertEquals(148, summary.mrpTotal)
        assertEquals(22, summary.savings)

        val empty = CartSummary.of(emptyList(), catalog, 199, 25)
        assertEquals(0, empty.itemCount)
        assertEquals(0, empty.savings)
    }

    @Test
    fun `AC-cart-4 delivery is free at or above the threshold`() {
        val below = CartSummary.of(listOf(CartLine("banana", 2), CartLine("milk", 1)), catalog, 199, 25)
        assertEquals(25, below.deliveryFee)
        assertEquals(151, below.toPay)
        assertEquals(73, below.amountToFreeDelivery)

        val above = CartSummary.of(listOf(CartLine("banana", 2), CartLine("milk", 1), CartLine("detergent", 1)), catalog, 199, 25)
        assertEquals(325, above.itemTotal)
        assertEquals(0, above.deliveryFee)
        assertEquals(325, above.toPay)
        assertEquals(0, above.amountToFreeDelivery)

        // Exactly at the threshold is free; an empty cart has no fee.
        assertEquals(0, CartSummary.of(listOf(CartLine("detergent", 1)), catalog, 199, 25).deliveryFee)
        assertEquals(0, CartSummary.of(emptyList(), catalog, 199, 25).deliveryFee)
        // The defaults come from AppConfig.
        assertEquals(25, CartSummary.of(listOf(CartLine("milk", 1)), catalog).deliveryFee)
    }

    @Test
    fun `AC-cart-7 placing an order saves it, empties the cart and reports the order id`() = runTest {
        val cart = InMemoryCartRepository(listOf(CartLine("banana", 2), CartLine("milk", 1)))
        val orders = InMemoryOrdersRepository()
        val viewModel = CartViewModel(catalog, cart, orders, clock = { 1761800123456 })
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }

        var placedId: String? = null
        viewModel.placeOrder { placedId = it }
        viewModel.placeOrder { error("a second tap must not place another order") }

        assertEquals("MN123456", placedId)
        val order = orders.order("MN123456")
        assertNotNull(order)
        order!!
        assertEquals(listOf("banana" to 2, "milk" to 1), order.lines.map { it.productId to it.quantity })
        assertEquals(3, order.itemCount)
        assertEquals(126, order.itemTotal)
        assertEquals(22, order.savings)
        assertEquals(25, order.deliveryFee)
        assertEquals(151, order.toPay)
        assertEquals(1, orders.orders.size)
        assertTrue(cart.lines.first().isEmpty())
    }
}
