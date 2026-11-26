package app.features.settings

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import app.generated.AppIdentity
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsTest {
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

    /** A DataStore-backed repository over [file], living in its own scope (one "app launch"). */
    private fun launchRepository(file: File, scope: CoroutineScope) =
        DataStoreSettingsRepository(PreferenceDataStoreFactory.create(scope = scope, produceFile = { file }))

    @Test
    fun `AC-settings-1 appearance defaults to System`() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        val repository = launchRepository(File(folder.root, "settings.preferences_pb"), scope)

        assertEquals(Appearance.System, repository.appearance.first())
        assertEquals(Appearance.System, Appearance.fromId("sepia"))
        scope.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-settings-2 choosing an appearance applies it to the whole app immediately`() = runTest {
        val repository = InMemorySettingsRepository()
        val viewModel = SettingsViewModel(repository)
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect {} }

        viewModel.selectAppearance(Appearance.Dark)

        // MainActivity themes the whole app from the repository's appearance.
        assertEquals(Appearance.Dark, repository.appearance.first())
        assertEquals(Appearance.Dark, viewModel.uiState.value.appearance)
        assertTrue(Appearance.Dark.isDark(systemIsDark = false))
        assertTrue(Appearance.System.isDark(systemIsDark = true))
        assertFalse(Appearance.Light.isDark(systemIsDark = true))
    }

    @Test
    fun `AC-settings-3 the chosen appearance survives a restart`() = runTest {
        val file = File(folder.root, "settings.preferences_pb")

        val firstLaunch = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        launchRepository(file, firstLaunch).setAppearance(Appearance.Light)
        firstLaunch.coroutineContext[Job]?.cancelAndJoin()

        val secondLaunch = CoroutineScope(UnconfinedTestDispatcher(testScheduler) + Job())
        assertEquals(Appearance.Light, launchRepository(file, secondLaunch).appearance.first())
        secondLaunch.coroutineContext[Job]?.cancelAndJoin()
    }

    @Test
    fun `AC-settings-4 shows the app version and build number`() {
        val state = SettingsUiState()
        assertEquals(AppIdentity.VERSION, state.version)
        assertEquals(AppIdentity.BUILD, state.build)
    }
}
