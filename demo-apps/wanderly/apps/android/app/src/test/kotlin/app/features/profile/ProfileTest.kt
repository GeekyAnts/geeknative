package app.features.profile

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.test.core.app.ApplicationProvider
import android.content.Context
import app.R
import app.generated.AppIdentity
import app.launchApp
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
class ProfileTest {
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
    fun `AC-profile-1 the traveler can change name and email and the new values are still there after a restart`() = runTest {
        val file = File(folder.root, "profile.preferences_pb")
        val first = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val repo1 = DataStoreProfileRepository(PreferenceDataStoreFactory.create(scope = first, produceFile = { file }))
        repo1.update(ProfileData(displayName = "Ada", email = "ada@example.com"))
        first.coroutineContext[Job]?.cancelAndJoin()

        val second = CoroutineScope(UnconfinedTestDispatcher() + Job())
        val loaded = DataStoreProfileRepository(
            PreferenceDataStoreFactory.create(scope = second, produceFile = { file }),
        ).data.first { it.displayName == "Ada" }
        assertEquals("Ada", loaded.displayName)
        assertEquals("ada@example.com", loaded.email)
        second.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-profile-2 usual travelers budget and favorite categories persist`() = runTest {
        val repo = InMemoryProfileRepository()
        val viewModel = ProfileViewModel(repo)
        viewModel.setTravelers(5)
        viewModel.setBudget("value")
        viewModel.toggleCategory("history")
        val stored = repo.data.first { it.defaultTravelers == 5 }
        assertEquals(5, stored.defaultTravelers)
        assertEquals("value", stored.budgetBand)
        assertEquals(listOf("history"), stored.preferredCategories)
    }

    @Test
    fun `AC-profile-3 the Settings entry opens Settings`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_profile)).performClick()
        compose.onNodeWithTag("profile.openSettings").performScrollTo().performClick()
        compose.onNodeWithTag("settings.appearance").assertIsDisplayed()
    }

    @Test
    fun `AC-profile-4 Profile shows the app version and build number`() {
        compose.launchApp()
        compose.onNodeWithText(string(R.string.tabs_profile)).performClick()
        compose.onNodeWithTag("profile.version").assertIsDisplayed()
        compose.onNodeWithText(
            ApplicationProvider.getApplicationContext<Context>().getString(
                R.string.settings_about_version,
                AppIdentity.VERSION,
                AppIdentity.BUILD,
            ),
        ).assertExists()
    }
}
