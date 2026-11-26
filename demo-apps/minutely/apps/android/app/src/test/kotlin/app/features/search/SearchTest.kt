package app.features.search

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import app.R
import app.features.cart.InMemoryCartRepository
import app.features.catalog.LocalCatalogRepository
import app.testing.launchApp
import app.testing.plural
import app.testing.string
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
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h914dp")
class SearchTest {
    @get:Rule
    val compose = createComposeRule()

    private val catalog = LocalCatalogRepository()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun ids(query: String) = catalog.search(query).map { it.id }

    @Test
    fun `AC-search-1 a blank or whitespace query shows the prompt and no results`() = runTest {
        assertEquals(emptyList<String>(), ids(""))
        assertEquals(emptyList<String>(), ids("   "))

        val viewModel = SearchViewModel(catalog, InMemoryCartRepository())
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }
        viewModel.setQuery("  \t ")
        assertEquals(SearchResults.Prompt, viewModel.uiState.value.results)
    }

    @Test
    fun `AC-search-2 results match every word case-insensitively in catalog order`() {
        assertEquals(listOf("milk"), ids("MILK"))
        assertEquals(listOf("cookies", "chocolate"), ids("choco"))
        assertEquals(listOf("banana", "apple", "tomato", "avocado", "carrot"), ids("fruit"))
        assertEquals(listOf("chips"), ids("salted chips"))
        assertEquals(emptyList<String>(), ids("xyz"))
        assertEquals(listOf("chips"), ids("  Chips   SALTED "))
    }

    @Test
    fun `AC-search-3 a query with no matches shows the no-results state naming the query`() = runTest {
        val viewModel = SearchViewModel(catalog, InMemoryCartRepository())
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }
        viewModel.setQuery(" xyz ")
        assertEquals(SearchResults.Empty("xyz"), viewModel.uiState.value.results)
    }

    @Test
    fun `AC-search-3 the screen shows the prompt, then no results naming the query`() {
        compose.launchApp()
        compose.onNodeWithTag("home.search").performClick()
        compose.onNodeWithTag("search.prompt").assertIsDisplayed()

        compose.onNodeWithTag("search.field").performTextInput("xyz")
        compose.onNodeWithTag("search.empty").assertIsDisplayed()
        compose.onNodeWithText(string(R.string.search_no_results_title, "xyz")).assertIsDisplayed()

        compose.onNodeWithTag("search.clear").performClick()
        compose.onNodeWithTag("search.prompt").assertIsDisplayed()
    }

    @Test
    fun `AC-search-4 results show the count and their Add buttons fill the cart`() {
        val cart = InMemoryCartRepository()
        compose.launchApp(app.core.AppContainer.preview(cartRepository = cart))
        compose.onNodeWithTag("home.search").performClick()

        compose.onNodeWithTag("search.field").performTextInput("choco")
        compose.onNodeWithTag("search.resultCount").assertTextEquals(plural(R.plurals.search_result_count, 2))

        compose.onNodeWithTag("product.cookies.add").performClick()
        compose.onNodeWithTag("product.cookies.quantity").assertTextEquals("1")
        compose.onNodeWithTag("cartBar").assertIsDisplayed()
        runTest { assertEquals(1, cart.quantity("cookies")) }
    }
}
