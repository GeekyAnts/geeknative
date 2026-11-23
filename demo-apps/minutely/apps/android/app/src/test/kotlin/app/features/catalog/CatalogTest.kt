package app.features.catalog

import app.features.cart.InMemoryCartRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CatalogTest {
    private val catalog = LocalCatalogRepository()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `AC-catalog-1 the catalog has the 6 categories and 30 products in order with exact fields`() {
        assertEquals(
            listOf("fruits", "dairy", "snacks", "drinks", "household", "personal"),
            catalog.categories().map { it.id },
        )
        assertEquals(Category("drinks", "Cold Drinks & Juices", "🧃"), catalog.categories()[3])

        val all = catalog.categories().flatMap { catalog.products(it.id) }
        assertEquals(30, all.size)
        assertEquals(
            listOf(
                "banana", "apple", "tomato", "avocado", "carrot",
                "milk", "eggs", "bread", "cheese", "butter",
                "chips", "popcorn", "cookies", "chocolate", "pretzels",
                "cola", "orange-juice", "coconut-water", "cold-brew", "water",
                "sponges", "detergent", "kitchen-towels", "broom", "garbage-bags",
                "toothpaste", "shampoo", "soap", "lip-balm", "razor",
            ),
            all.map { it.id },
        )
        assertEquals(Product("banana", "Robusta Banana", "6 pcs", 49, 60, "🍌", "fruits", true), catalog.product("banana"))
        assertEquals(Product("soap", "Moisturising Soap", "4 × 100 g", 160, 200, "🧼", "personal", true), catalog.product("soap"))
        assertEquals(Product("garbage-bags", "Garbage Bags", "30 pcs", 79, 99, "🗑️", "household", false), catalog.product("garbage-bags"))
        assertEquals(null, catalog.product("unicorn"))
        assertEquals(5, catalog.products("dairy").size)
    }

    @Test
    fun `AC-catalog-2 discount is rounded down and absent when MRP equals price`() {
        assertEquals(18, catalog.product("banana")!!.discountPercent) // 11 * 100 / 60 = 18.3
        assertEquals(19, catalog.product("apple")!!.discountPercent) // 31 * 100 / 160 = 19.375
        assertEquals(25, catalog.product("avocado")!!.discountPercent) // 50 * 100 / 199 = 25.1
        assertEquals(0, catalog.product("milk")!!.discountPercent)
        assertEquals(0, catalog.product("chips")!!.discountPercent)
    }

    @Test
    fun `AC-catalog-3 bestsellers are the 9 bestseller products in catalog order`() {
        assertEquals(
            listOf("banana", "apple", "milk", "bread", "cookies", "chocolate", "orange-juice", "detergent", "soap"),
            catalog.bestsellers().map { it.id },
        )
    }

    @Test
    fun `AC-catalog-4 the Category screen lists exactly the chosen category and switches with a chip`() = runTest {
        val viewModel = CategoryViewModel(catalog, InMemoryCartRepository(), "snacks")
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }

        assertEquals("snacks", viewModel.uiState.value.selected.id)
        assertEquals(listOf("chips", "popcorn", "cookies", "chocolate", "pretzels"), viewModel.uiState.value.products.map { it.id })

        viewModel.select("drinks")
        assertEquals("drinks", viewModel.uiState.value.selected.id)
        assertEquals(listOf("cola", "orange-juice", "coconut-water", "cold-brew", "water"), viewModel.uiState.value.products.map { it.id })

        // An unknown category id shows the first category.
        val unknown = CategoryViewModel(catalog, InMemoryCartRepository(), "unicorn")
        assertEquals("fruits", unknown.uiState.value.selected.id)
    }

    @Test
    fun `AC-catalog-5 Add puts one of the product in the cart`() = runTest {
        val cart = InMemoryCartRepository()
        val viewModel = CategoryViewModel(catalog, cart, "fruits")
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }

        viewModel.add("banana")

        assertEquals(1, cart.quantity("banana"))
        assertEquals(1, viewModel.uiState.value.cart.quantity("banana"))
    }
}
