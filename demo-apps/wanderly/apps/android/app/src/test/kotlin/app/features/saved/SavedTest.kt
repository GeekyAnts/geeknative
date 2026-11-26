package app.features.saved

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.features.catalog.InMemoryCatalogRepository
import app.launchApp
import app.loadCatalog
import app.previewContainer
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
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "w411dp-h2500dp")
class SavedTest {
    @get:Rule
    val compose = createComposeRule()

    @get:Rule
    val folder = TemporaryFolder()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun string(id: Int) = ApplicationProvider.getApplicationContext<Context>().getString(id)

    @Test
    fun `AC-saved-1 Saved lists destinations and places the traveler has saved with photographs`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val saved = InMemorySavedRepository(
            listOf(SavedItem("bali", "destination"), SavedItem("paris-eiffel", "attraction")),
        )
        val viewModel = SavedViewModel(saved, catalog)
        val state = viewModel.uiState.first { !it.empty }
        assertTrue(state.destinations.any { it.destination.id == "bali" && it.destination.imageUrl.isNotBlank() })
        assertTrue(state.places.any { it.place.id == "paris-eiffel" && it.place.imageUrl.isNotBlank() })
    }

    @Test
    fun `AC-saved-2 Unsaving from this screen removes the item from the list and from storage`() = runTest {
        val catalog = InMemoryCatalogRepository(loadCatalog())
        val saved = InMemorySavedRepository(listOf(SavedItem("bali", "destination")))
        val viewModel = SavedViewModel(saved, catalog)
        viewModel.uiState.first { !it.empty }
        viewModel.unsave("bali")
        assertTrue(saved.items.first().isEmpty())
        assertTrue(viewModel.uiState.first { it.empty }.empty)
    }

    @Test
    fun `AC-saved-3 when nothing is saved the empty state is shown`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_saved)).performClick()
        compose.onNodeWithTag("saved.empty").assertIsDisplayed()
    }

    @Test
    fun `AC-saved-4 opening a saved destination shows City details`() {
        compose.launchApp(
            previewContainer(savedItems = listOf(SavedItem("bali", "destination"))),
        )
        compose.onNodeWithText(string(R.string.tabs_saved)).performClick()
        compose.onNodeWithTag("saved.destination.bali").performClick()
        compose.onNodeWithTag("city.hero").assertIsDisplayed()
        compose.onNodeWithText("Bali").assertExists()
    }

    @Test
    fun `AC-saved-5 Saved items are still listed after an app restart`() = runTest {
        val file = File(folder.root, "saved.preferences_pb")
        val first = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val repo1 = DataStoreSavedRepository(PreferenceDataStoreFactory.create(scope = first, produceFile = { file }))
        repo1.toggle("bali", "destination")
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val repo2 = DataStoreSavedRepository(PreferenceDataStoreFactory.create(scope = second, produceFile = { file }))
        val items = repo2.items.first { it.isNotEmpty() }
        assertEquals("bali", items.first().id)
        assertEquals("destination", items.first().kind)
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `invalid saved JSON is treated as empty`() {
        assertTrue(decodeSavedItems("not-json").isEmpty())
        assertTrue(decodeSavedItems(null).isEmpty())
        assertEquals(1, decodeSavedItems("""[{"id":"a","kind":"destination"},{"id":"a","kind":"hotel"}]""").size)
    }
}
